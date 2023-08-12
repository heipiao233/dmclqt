import { QGridLayout, QPushButton, QSizePolicyPolicy } from '@nodegui/nodegui';
import { Account, Launcher } from 'dmclc';
import { Config } from '../config';
import launcherInterface from '../launcherInterface';
import { Tab, addTabAndSwitch } from '../tabs';
import { GameOptionsTab } from './GameOptionsTab';
import LogTab from './LogTab';
import SelectGameDirTab from './SelectGameDirTab';
import { SettingsTab } from './SettingsTab';
import SelectAccountTab from './selectaccount';
import SelectGameTab from './selectgame';

export default class MainPageTab extends Tab {
    launchButton = new QPushButton();
    optionsButton = new QPushButton();
    accountButton = new QPushButton();
    versionButton = new QPushButton();
    dirButton = new QPushButton();
    settingsButton = new QPushButton();
    constructor(private launcher: Launcher, private sharedData: Map<string, any>, config: Config) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);

        this.launchButton.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Preferred)
        this.launchButton.setText("启动选择的游戏");
        this.launchButton.addEventListener("clicked", async () => this.launchGame());
        layout.addWidget(this.launchButton, 0, 0, 1, 4);

        this.optionsButton.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Preferred)
        this.optionsButton.setText("版本选项");
        this.optionsButton.addEventListener("clicked", async () => {
            let game = launcher.installedVersions.get(sharedData.get("selectedGame"))!;
            addTabAndSwitch(new GameOptionsTab(game, launcher), `版本选项 - ${game.name}`);
        });

        layout.addWidget(this.optionsButton, 1, 0, 1, 4);
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

        this.settingsButton.setText("设置...");
        this.settingsButton.addEventListener("clicked", () => {
            addTabAndSwitch(new SettingsTab(launcher, sharedData, config), "安装游戏");
        });
        layout.addWidget(this.settingsButton, 2, 3);
    }

    async onSelected() {
        this.accountButton.setText(this.sharedData.get("account")?.toString() ?? "选择账户...");
        this.versionButton.setText(this.sharedData.get("selectedGame")?.toString() ?? "选择版本...");
        this.dirButton.setText(this.launcher.rootPath);
        this.launchButton.setDisabled(!this.launcher.installedVersions.has(this.sharedData.get("selectedGame")));
        let game = this.launcher.installedVersions.get(this.sharedData.get("selectedGame"));
        this.optionsButton.setDisabled(!(
            game
            && (this.launcher.usingJava || game.extras.usingJava)
            && this.sharedData.get("account")
        ));
    }

    async launchGame() {
        const account: Account<any> = this.sharedData.get("account");
        const selectedGame = this.launcher.installedVersions.get(this.sharedData.get("selectedGame"))!;
        selectedGame.extras.enableIndependentGameDir = true;
        selectedGame.saveExtras();
        try {
            const cp = await selectedGame.run(this.sharedData.get("account"));
            addTabAndSwitch(new LogTab(cp, account.getTokens()), `日志 - ${selectedGame.name}`);
        } catch {
            launcherInterface.error("启动失败！");
        }
    }
}
