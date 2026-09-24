/*
 * Interactive WhatsApp linking helper.
 *
 * Example:
 * node scripts/link-session.js primary
 */

process.env.SHOW_QR_IN_TERMINAL =
  "true";

const config =
  require("../config");

const logger =
  require("../helpers/logger");

const {
  initializeSession,
  getSessionReport,
  shutdownSessions,
} = require(
  "../services/whatsapp",
);

const sessionId =
  process.argv[2] ||
  config.whatsapp.sessions[0];

if (
  !config.whatsapp.sessions.includes(
    sessionId,
  )
) {
  process.stderr.write(
    `Unknown session: ${sessionId}\n`,
  );

  process.exit(1);
}

async function stop(exitCode) {
  await shutdownSessions();
  process.exit(exitCode);
}

async function main() {
  process.stdout.write(
    `Linking WhatsApp session [${sessionId}]\n`,
  );

  await initializeSession(
    sessionId,
  );

  const interval = setInterval(
    () => {
      const session =
        getSessionReport()
          .find(
            (item) =>
              item.id === sessionId,
          );

      if (
        session?.status === "READY"
      ) {
        clearInterval(interval);

        process.stdout.write(
          `Session [${sessionId}] is READY.\n`,
        );

        void stop(0);
      }
    },
    1000,
  );

  process.on(
    "SIGINT",
    () => {
      clearInterval(interval);
      void stop(0);
    },
  );
}

main().catch(
  (error) => {
    logger(
      "fatal",
      "link_session.failed",
      {
        session: sessionId,
        reason: error.message,
      },
    );

    void stop(1);
  },
);
