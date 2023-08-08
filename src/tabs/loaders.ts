import { ButtonRole, Direction, QBoxLayout, QGroupBox, QListWidget, QListWidgetItem, QMessageBox, QPushButton } from "@nodegui/nodegui";
import { Launcher } from 'dmclc';
import { MinecraftVersion } from "dmclc/lib/version";
import launcherInterface from "../launcherInterface";
import { Tab } from "../tabs";

export default class LoadersTab extends Tab {
    versionList: QListWidget;
    loaderList: QListWidget;
    constructor(private launcher: Launcher, private version: MinecraftVersion) {
        super();
        const loaderBox = new QGroupBox();
        loaderBox.setTitle("选择加载器");
        const loaderLayout = new QBoxLayout(Direction.BottomToTop);
        this.loaderList = new QListWidget();
        loaderLayout.addWidget(this.loaderList);
        loaderBox.setLayout(loaderLayout);
        const versionBox = new QGroupBox();
        versionBox.setTitle("加载器版本");
        const versionLayout = new QBoxLayout(Direction.BottomToTop);
        this.versionList = new QListWidget();
        versionLayout.addWidget(this.versionList);
        versionBox.setLayout(versionLayout);
        const layout = new QBoxLayout(Direction.LeftToRight);
        layout.addWidget(loaderBox);
        layout.addWidget(versionBox);
        this.setLayout(layout);
        launcher.loaders.forEach((v, k) => {
            this.loaderList.addItem(new QListWidgetItem(k));
        });
        this.loaderList.addEventListener("currentItemChanged", async (current) => await this.loadVersionList(current.text()));
        this.versionList.addEventListener("itemActivated", async (item) => {
            await this.installLoader(this.loaderList.currentItem().text(), item.text());
        });
    }
    async installLoader(loaderType: string, loaderVersion: string) {
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
        try {
            await this.version.installLoader(loaderType, loaderVersion);
            launcherInterface.info(`${loaderType} 版本 ${loaderVersion} 安装成功！`);
        } catch (e) {
            if (e instanceof Error) {
                launcherInterface.error(`${loaderType} 版本 ${loaderVersion} 安装失败：${e.message}`);
            } else {
                launcherInterface.error(`${loaderType} 版本 ${loaderVersion} 安装失败！`);
            }
        }
    }
    async loadVersionList(loaderID: string): Promise<void> {
        if (!this.version) {
            launcherInterface.error("未选择游戏！");
            return;
        }
        try {
            let versions = await this.version.getSuitableLoaderVersions(loaderID)
            this.versionList.clear();
            for (const i of versions) {
                const listItem = new QListWidgetItem();
                listItem.setText(i);
                this.versionList.addItem(listItem);
            }
        } catch {
            launcherInterface.error(`加载 ${loaderID} 版本列表失败！`);
        }
    }
}
