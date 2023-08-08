import { QGridLayout, QPushButton, QSizePolicyPolicy } from '@nodegui/nodegui';
import { Account, Launcher } from 'dmclc';
import { Config } from '../config';
import launcherInterface from '../launcherInterface';
import { Tab, addTabAndSwitch } from '../tabs';
import { GameOptionsTab } from './GameOptionsTab';
import LogTab from './LogTab';
import SelectGameDirTab from './SelectGameDirTab';
import { SettingsTab } from './SettingsTab';
import InstallTab from './install';
import SelectAccountTab from './selectaccount';
import SelectGameTab from './selectgame';

export default class MainPageTab extends Tab {
    accountButton = new QPushButton();
    versionButton = new QPushButton();
    installButton = new QPushButton();
    dirButton = new QPushButton();
    settingsButton = new QPushButton();
    constructor(private launcher: Launcher, private sharedData: Map<string, any>, config: Config) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);

        const launchButton = new QPushButton();
        launchButton.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Preferred)
        launchButton.setText("启动选择的游戏");
        launchButton.addEventListener("clicked", async () => this.launchGame());
        layout.addWidget(launchButton, 0, 0, 1, 5);

        const modButton = new QPushButton();
        modButton.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Preferred)
        modButton.setText("版本选项");
        modButton.addEventListener("clicked", async () => {
            let game = launcher.installedVersions.get(sharedData.get("selectedGame"));
            if (!game) {
                launcherInterface.error("你未选择游戏！");
                return;
            }
            addTabAndSwitch(new GameOptionsTab(game, launcher), `版本选项 - ${game.name}`);
        });

        layout.addWidget(modButton, 1, 0, 1, 5);
        this.accountButton.setText(sharedData.get("account")?.toString() ?? "选择账户...");
        this.accountButton.addEventListener("clicked", () => addTabAndSwitch(new SelectAccountTab(launcher, sharedData), "选择账户"));
        layout.addWidget(this.accountButton, 2, 0);

        this.versionButton.setText(sharedData.get("selectedGame")?.toString() ?? "选择版本...");
        this.versionButton.addEventListener("clicked", () => addTabAndSwitch(new SelectGameTab(launcher, sharedData), "选择版本"));
        layout.addWidget(this.versionButton, 2, 1);

        this.dirButton.setText(launcher.rootPath);
        this.dirButton.addEventListener("clicked", () => {
            addTabAndSwitch(new SelectGameDirTab(launcher, sharedData), "选择游戏目录");
        });
        layout.addWidget(this.dirButton, 2, 2);

        this.installButton.setText("安装游戏...");
        this.installButton.addEventListener("clicked", () => {
            addTabAndSwitch(new InstallTab(launcher), "安装游戏");
        });
        layout.addWidget(this.installButton, 2, 3);

        this.settingsButton.setText("设置...");
        this.settingsButton.addEventListener("clicked", () => {
            addTabAndSwitch(new SettingsTab(launcher, sharedData, config), "安装游戏");
        });
        layout.addWidget(this.settingsButton, 2, 4);
    }

    async onSelected() {
        this.accountButton.setText(this.sharedData.get("account")?.toString() ?? "选择账户...");
        this.versionButton.setText(this.sharedData.get("selectedGame")?.toString() ?? "选择版本...");
        this.dirButton.setText(this.launcher.rootPath);
    }

    async launchGame() {
        const account: Account<any> = this.sharedData.get("account");
        const selectedGame = this.launcher.installedVersions.get(this.sharedData.get("selectedGame"));
        if (!this.launcher.usingJava) {
            launcherInterface.error("你未选择 Java！");
            return;
        }
        if (!selectedGame) {
            launcherInterface.error("你未选择游戏！");
            return;
        }
        selectedGame.extras.enableIndependentGameDir = true;
        selectedGame.saveExtras();
        if (!account) {
            launcherInterface.error("你未选择账号！");
            return;
        }
        try {
            const cp = await selectedGame.run(this.sharedData.get("account"));
            addTabAndSwitch(new LogTab(cp, account.getTokens()), `日志 - ${selectedGame.name}`);
        } catch {
            launcherInterface.error("启动失败！");
        }
    }
}
