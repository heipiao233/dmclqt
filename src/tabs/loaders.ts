import { ButtonRole, Direction, QBoxLayout, QGroupBox, QListWidget, QListWidgetItem, QMessageBox, QPushButton } from "@nodegui/nodegui";
import { FormattedError, Launcher } from 'dmclc';
import { Tab } from "../tabs";

export default class LoadersTab extends Tab {
    versionList: QListWidget;
    loaderList: QListWidget;
    constructor(private launcher: Launcher, private sharedData: Map<string, any>) {
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
            await this.launcher.installedVersions.get(this.sharedData.get("selectedGame"))!.installLoader(loaderType, loaderVersion);
            const box = new QMessageBox();
            box.setWindowTitle("安装成功！")
            box.setText(`${loaderType} 版本 ${loaderVersion} 安装成功！`)
            const accept = new QPushButton();
            accept.setText("确认");
            box.addButton(accept, ButtonRole.AcceptRole);
            box.exec();
        } catch (e) {
            if (e instanceof FormattedError) {
                const box = new QMessageBox();
                box.setWindowTitle("安装出错！")
                box.setText(`${loaderType} 版本 ${loaderVersion} 安装出错：${e.message}`)
                const accept = new QPushButton();
                accept.setText("确认");
                box.addButton(accept, ButtonRole.AcceptRole);
                box.exec();
            }
        }
    }
    async loadVersionList(loaderID: string): Promise<void> {
        const selectedGame = this.launcher.installedVersions.get(this.sharedData.get("selectedGame"));
        if (!selectedGame) {
            const box = new QMessageBox();
            box.setWindowTitle("错误");
            box.setText(`你未选择游戏！`);
            const accept = new QPushButton();
            accept.setText("确认");
            box.addButton(accept, ButtonRole.AcceptRole);
            box.exec();
            return;
        }
        let versions = await selectedGame.getSuitableLoaderVersions(loaderID)
        this.versionList.clear();   
        for (const i of versions) {
            const listItem = new QListWidgetItem();
            listItem.setText(i);
            this.versionList.addItem(listItem);
        }
    }
}
