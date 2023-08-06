import { ButtonRole, QGridLayout, QMessageBox, QPushButton, QSizePolicyPolicy } from '@nodegui/nodegui';
import { Account, Launcher } from 'dmclc';
import { Config } from '../config';
import { Tab, addTabAndSwitch } from '../tabs';
import LogTab from './LogTab';
import ModListTab from './ModListTab';
import SelectGameDirTab from './SelectGameDirTab';
import { SettingsTab } from './SettingsTab';
import ContentTab from './contents';
import InstallTab from './install';
import LoadersTab from './loaders';
import SelectAccountTab from './selectaccount';
import SelectGameTab from './selectgame';

export default class MainPageTab extends Tab {
    accountButton = new QPushButton();
    versionButton = new QPushButton();
    contentsButton = new QPushButton();
    loaderButton = new QPushButton();
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
        layout.addWidget(launchButton, 0, 0, 1, 7);

        const modButton = new QPushButton();
        modButton.setSizePolicy(QSizePolicyPolicy.Minimum, QSizePolicyPolicy.Preferred)
        modButton.setText("查看模组");
        modButton.addEventListener("clicked", async () => {
            let game = launcher.installedVersions.get(sharedData.get("selectedGame"));
            if (!game) {
                const box = new QMessageBox();
                box.setWindowTitle("错误");
                box.setText(`你未选择游戏！`);
                const accept = new QPushButton();
                accept.setText("确认");
                box.addButton(accept, ButtonRole.AcceptRole);
                box.show();
                return;
            }
            addTabAndSwitch(new ModListTab(game, launcher), `模组列表 - ${game.name}`);
        });

        layout.addWidget(modButton, 1, 0, 1, 7);
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

        this.contentsButton.setText("浏览内容...");
        this.contentsButton.addEventListener("clicked", () => addTabAndSwitch(new ContentTab(launcher, sharedData), "内容"));
        layout.addWidget(this.contentsButton, 2, 3);

        this.loaderButton.setText("安装加载器...");
        this.loaderButton.addEventListener("clicked", () => {
            if (!sharedData.get("selectedGame")) {
                const box = new QMessageBox();
                box.setWindowTitle("错误");
                box.setText(`你未选择游戏！`);
                const accept = new QPushButton();
                accept.setText("确认");
                box.addButton(accept, ButtonRole.AcceptRole);
                box.show();
                return;
            }
            addTabAndSwitch(new LoadersTab(launcher, sharedData), "加载器");
        });
        layout.addWidget(this.loaderButton, 2, 4);

        this.installButton.setText("安装游戏...");
        this.installButton.addEventListener("clicked", () => {
            addTabAndSwitch(new InstallTab(launcher), "安装游戏");
        });
        layout.addWidget(this.installButton, 2, 5);

        this.settingsButton.setText("设置...");
        this.settingsButton.addEventListener("clicked", () => {
            addTabAndSwitch(new SettingsTab(launcher, sharedData, config), "安装游戏");
        });
        layout.addWidget(this.settingsButton, 2, 6);
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
            const box = new QMessageBox();
            box.setWindowTitle("错误");
            box.setText(`你未选择 Java！`);
            const accept = new QPushButton();
            accept.setText("确认");
            box.addButton(accept, ButtonRole.AcceptRole);
            box.show();
            return;
        }
        if (!selectedGame) {
            const box = new QMessageBox();
            box.setWindowTitle("错误");
            box.setText(`你未选择游戏！`);
            const accept = new QPushButton();
            accept.setText("确认");
            box.addButton(accept, ButtonRole.AcceptRole);
            box.show();
            return;
        }
        selectedGame.extras.enableIndependentGameDir = true;
        selectedGame.saveExtras();
        if (!account) {
            const box = new QMessageBox();
            box.setWindowTitle("错误");
            box.setText(`你未选择账号！`);
            const accept = new QPushButton();
            accept.setText("确认");
            box.addButton(accept, ButtonRole.AcceptRole);
            box.show();
            return;
        }
        if (!await account.check()) {
            await account.login();
        }
        const cp = await selectedGame.run(this.sharedData.get("account"));
        addTabAndSwitch(new LogTab(cp), `日志 - ${selectedGame.name}`);
    }
}
