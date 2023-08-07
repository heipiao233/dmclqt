import { UserData } from "dmclc";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createFile, ensureDir } from "fs-extra";
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
let configFile = `${homedir()}/.dmclqt/config.json`;
if (existsSync(configFile)) {
    try {
        config = JSON.parse(readFileSync(configFile).toLocaleString());
    } catch {
        createConfig();
    }
} else {
    await createConfig();
}

async function createConfig() {
    createFile(configFile);
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
    saveConfig();
}

export function saveConfig() {
    writeFileSync(configFile, JSON.stringify(config));
}
