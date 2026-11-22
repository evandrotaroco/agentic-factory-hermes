#!/usr/bin/env python3
"""Notify Discord of a factory delegation without relaying its contents."""

import argparse
from http.client import HTTPException
import json
import os
from pathlib import Path
import re
import sys
from urllib.error import HTTPError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


WORKSPACE = "agentic-factory-hermes"
VARIABLE = "FACTORY_DISCORD_WEBHOOK_URL"
AGENTS = {
    "analista-requisitos": {"E1"},
    "arquiteto": {"E2"},
    "criador-tarefas": {"E3"},
    "desenvolvedor": {"E4"},
    "revisor-codigo": {"E5", "E6"},
    "qa": {"E6"},
}
# Only these fixed phrases can leave the checkout. Never accept free-text summaries.
OUTCOMES = {
    "DONE": ("Tarefa concluída", "Retorno recebido, sujeito à validação."),
    "BLOCKED": ("Tarefa bloqueada", "Há um impedimento para avançar."),
    "NEEDS_CLARIFICATION": ("Aguardando esclarecimento", "Há perguntas pendentes."),
    "HUMAN_REVIEW_REQUIRED": ("Aguardando revisão humana", "É necessária revisão humana."),
    "FAILED": ("Falha na execução", "Execução terminou com erro."),
    "INTERRUPTED": ("Execução interrompida", "Execução interrompida sem conclusão da tarefa."),
    "INVALID_RETURN": ("Retorno inválido", "Contrato de retorno ausente ou inválido."),
}


class NotificationError(Exception):
    """A diagnostic safe to print without the URL, payload or response body."""


class ArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        # argparse normally echoes rejected values, which might contain secrets.
        self.exit(2, "Argumentos inválidos. Consulte --help.\n")


def parse_args(argv):
    parser = ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument("--agent", required=True, choices=AGENTS)
    parser.add_argument("--stage", required=True, choices=("E1", "E2", "E3", "E4", "E5", "E6"))
    parser.add_argument("--status", required=True, choices=OUTCOMES)
    parser.add_argument("--summary", required=True, help="Frase fixa do status, sem texto livre.")
    parser.add_argument("--dry-run", action="store_true", help="Exibe a mensagem sem ler credenciais ou enviar.")
    parser.epilog = "Resumos por status: " + " ".join(
        f"{key}: {summary}" for key, (_, summary) in OUTCOMES.items()
    )
    args = parser.parse_args(argv)
    if args.stage not in AGENTS[args.agent] or args.summary != OUTCOMES[args.status][1]:
        parser.error("Par agente/etapa ou resumo inválido.")
    return args


def workspace_root():
    root = Path(__file__).resolve().parents[1]
    cwd = Path.cwd().resolve()
    if (
        root.name.casefold() != WORKSPACE
        or not (root / ".hermes.md").is_file()
        or not (root / ".git").exists()
        or not cwd.is_relative_to(root)
    ):
        raise NotificationError("Execute dentro do checkout agentic-factory-hermes que contém o script.")
    return root


def read_webhook(root):
    value = os.environ.get(VARIABLE, "").strip()
    if value:
        return value

    profile = os.environ.get("HERMES_HOME")
    if profile:
        home = Path(profile).expanduser()
    elif os.name == "nt" and os.environ.get("LOCALAPPDATA"):
        home = Path(os.environ["LOCALAPPDATA"]) / "hermes"
    else:
        home = Path.home() / ".hermes"
    if not home.is_absolute():
        raise NotificationError("O diretório do perfil Hermes deve ser absoluto.")

    try:
        env_file = (home / ".env").resolve()
        if env_file.is_relative_to(root):
            raise NotificationError("O arquivo .env do perfil deve ficar fora do repositório.")
        with env_file.open(encoding="utf-8-sig") as stream:
            for line in stream:
                match = re.fullmatch(
                    rf"\s*(?:export\s+)?{VARIABLE}\s*=\s*"
                    r"(?:\"([^\"]*)\"|'([^']*)'|([^\s#]+))?\s*(?:#[^\r\n]*)?\s*",
                    line,
                )
                if match:
                    value = next((part for part in match.groups() if part is not None), "").strip()
    except FileNotFoundError:
        pass
    except (OSError, UnicodeError, RuntimeError):
        raise NotificationError("Não foi possível ler o .env do perfil Hermes.") from None

    if not value:
        raise NotificationError(f"{VARIABLE} não está configurada no ambiente nem no perfil Hermes.")
    return value


def confirmed_url(value):
    error = NotificationError(f"{VARIABLE} deve conter uma URL HTTPS de webhook do Discord válida.")
    if any(not char.isascii() or char.isspace() or not char.isprintable() for char in value):
        raise error
    try:
        url = urlsplit(value)
        query = parse_qsl(url.query, keep_blank_values=True, strict_parsing=True, max_num_fields=2)
    except ValueError:
        raise error from None
    if (
        url.scheme != "https"
        or url.netloc.lower() not in {"discord.com", "discordapp.com"}
        or url.fragment
        or not re.fullmatch(r"/api/(?:v[0-9]+/)?webhooks/[0-9]+/[A-Za-z0-9_-]+", url.path)
        or len(dict(query)) != len(query)
        or any(
            not ((key == "thread_id" and re.fullmatch(r"[0-9]+", val))
                 or (key == "wait" and val in {"true", "false"}))
            for key, val in query
        )
    ):
        raise error
    params = dict(query)
    params["wait"] = "true"
    return urlunsplit((url.scheme, url.netloc, url.path, urlencode(params), ""))


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def send_notification(url, content):
    data = json.dumps({"content": content, "allowed_mentions": {"parse": []}}).encode("utf-8")
    request = Request(url, data=data, headers={
        "Content-Type": "application/json",
        "User-Agent": "AgenticSoftwareFactoryNotifier/1.0",
    }, method="POST")
    try:
        with build_opener(NoRedirect()).open(request, timeout=8) as response:
            if response.status != 200:
                raise NotificationError(f"Discord não confirmou a mensagem (HTTP {response.status}).")
            raw = response.read(65537)
        message = json.loads(raw) if len(raw) <= 65536 else None
    except HTTPError as exc:
        code = exc.code
        exc.close()
        raise NotificationError(f"Discord não confirmou a mensagem (HTTP {code}).") from None
    except (HTTPException, OSError, ValueError, RecursionError):
        raise NotificationError("Sem confirmação do Discord: falha de rede ou resposta inválida.") from None
    if not isinstance(message, dict) or not re.fullmatch(r"[0-9]+", str(message.get("id", ""))):
        raise NotificationError("Discord respondeu sem um ID de mensagem válido.")


def main(argv=None):
    args = parse_args(argv)
    label, summary = OUTCOMES[args.status]
    content = (
        f"**Fábrica de Software Agêntica**\n"
        f"Agente: `{args.agent}` | Etapa: `{args.stage}`\n"
        f"Status: **{label}** (`{args.status}`)\n{summary}"
    )
    try:
        root = workspace_root()
        if args.dry_run:
            print(f"SIMULAÇÃO — nenhuma mensagem enviada.\n{content}")
            return 0
        send_notification(confirmed_url(read_webhook(root)), content)
    except (NotificationError, OSError, RuntimeError) as exc:
        diagnostic = str(exc) if isinstance(exc, NotificationError) else "Falha local ao preparar a notificação."
        print(diagnostic, file=sys.stderr)
        return 1
    print("Envio confirmado pelo Discord.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
