import { UserData } from "dmclc";
import envPaths from "env-paths";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createFile, ensureDir, ensureFile } from "fs-extra";
import { homedir } from "os";
import { platform } from "process";

export type Config = {
    usingJava: string;
    usingUser: number;
    usingDir: number;
    userDefinedJava: string[];
    users: {
        type: string,
        data: Record<string, unknown> & UserData
    }[];
    gameDirs: string[];
    mirror?: string
}
export let config: Config;
let configFile = `${envPaths("DMCLQT").config}/config.json`;
await ensureFile(configFile);
try {
    config = JSON.parse(readFileSync(configFile).toLocaleString());
} catch {
    if (existsSync(`${homedir()}/.dmclqt/config.json`)) {
        config = JSON.parse(readFileSync(configFile).toLocaleString());
    } else {
        await createFile(configFile);
        let gameDir = `${homedir()}/.minecraft`;
        if (platform == "win32") {
            gameDir = `${homedir()}/AppData/Roaming/.minecraft`;
        }
        await ensureDir(gameDir);
        config = {
            usingJava: "",
            users: [],
            userDefinedJava: [],
            gameDirs: [gameDir],
            usingUser: -1,
            usingDir: 0
        };
    }
    saveConfig();
}

export function saveConfig() {
    writeFileSync(configFile, JSON.stringify(config));
}
