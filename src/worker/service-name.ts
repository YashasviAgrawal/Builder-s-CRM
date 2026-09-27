/**
 * Names this process "worker" in log entries. Imported first by the worker entry point because the logger reads
 * SERVICE_NAME when it is created; set here rather than as a `SERVICE_NAME=worker` script prefix, which Windows'
 * cmd.exe (npm and pnpm's default script shell there) cannot run. An explicit SERVICE_NAME (Dockerfile) still wins.
 */
process.env.SERVICE_NAME ??= "worker";
