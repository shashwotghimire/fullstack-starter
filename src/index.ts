#!/usr/bin/env node
import { runCLI } from "./cli";
import { getRuntimeArgv } from "./utils/files";

await runCLI(getRuntimeArgv());
