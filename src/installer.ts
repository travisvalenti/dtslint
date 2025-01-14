import assert = require("assert");
import { exec } from "child_process";
import { TypeScriptVersion } from "definitelytyped-header-parser";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { TsVersion } from "./lint";

const installsDir = path.join(os.homedir(), ".dts", "typescript-installs");

export async function installAll() {
    for (const v of TypeScriptVersion.all) {
        // manually instead typescript@next outside the loop
        if (v === TypeScriptVersion.all[TypeScriptVersion.all.length - 1]) { continue; }
        await install(v);
    }
    await installNext();
}

export async function installNext() {
    await install("next");
}

async function install(version: TsVersion): Promise<void> {
    if (version === "local") {
        return;
    }
    const dir = installDir(version);
    if (!await fs.pathExists(dir)) {
        console.log(`Installing to ${dir}...`);
        await fs.mkdirp(dir);
        await fs.writeJson(path.join(dir, "package.json"), packageJson(version));
        await execAndThrowErrors("npm install --ignore-scripts --no-shrinkwrap --no-package-lock --no-bin-links", dir);
        console.log("Installed!");
        console.log("");
    }
}

export function cleanInstalls(): Promise<void> {
    return fs.remove(installsDir);
}

export function typeScriptPath(version: TsVersion, tsLocal: string | undefined): string {
    if (version === "local") {
        return tsLocal! + "/typescript.js";
    }
    return path.join(installDir(version), "node_modules", "typescript");
}

function installDir(version: TsVersion): string {
    assert(version !== "local");
    return path.join(installsDir, version);
}

/** Run a command and return the stdout, or if there was an error, throw. */
async function execAndThrowErrors(cmd: string, cwd?: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(cmd, { encoding: "utf8", cwd }, (err, _stdout, stderr) => {
            if (stderr) {
                console.error(stderr);
            }

            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function packageJson(version: TsVersion): {} {
    return {
        description: `Installs typescript@${version}`,
        repository: "N/A",
        license: "MIT",
        dependencies: {
            typescript: version,
        },
    };
}
