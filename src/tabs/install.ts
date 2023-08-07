import { QGridLayout, QInputDialog, QListWidget, QListWidgetItem } from '@nodegui/nodegui';
import { Launcher, VersionInfo } from 'dmclc';
import launcherInterface from '../launcherInterface';
import { Tab } from '../tabs';

export default class InstallTab extends Tab {
    versionListToInstall: QListWidget = new QListWidget();
    data: Map<string, VersionInfo> = new Map<string, VersionInfo>();
    constructor(private launcher: Launcher) {
        super();
        this.versionListToInstall.addEventListener("itemActivated", (item) => this.install(item.text()));
        let layout = new QGridLayout();
        layout.addWidget(this.versionListToInstall);
        this.setLayout(layout);
    }

    askVersionName(default_: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const input = new QInputDialog();
            input.addEventListener("accepted", () => resolve(input.textValue()));
            input.addEventListener("rejected", reject);
            input.show();
        });
    }

    async install(item: string) {
        try {
            const name = await this.askVersionName(item);
            if (this.launcher.installedVersions.has(name)) {
                launcherInterface.error(`版本 ${name} 已经存在！`);
                return;
            }
            let v = await this.launcher.installer.install(this.data.get(item)!, name, true);
            v.saveExtras();
            this.launcher.refreshInstalledVersion();
            launcherInterface.info(`Minecraft 版本 ${item} 安装成功！`);
        } catch {
            launcherInterface.error(`Minecraft 版本 ${item} 安装失败！`);
        }
    }

    async onSelected() {
        const v = await this.launcher.installer.getVersionList();
        this.data.clear();
        this.versionListToInstall.clear();
        for (const i of v.versions) {
            const widgetItem = new QListWidgetItem(i.id);
            this.data.set(i.id, i);
            this.versionListToInstall.addItem(widgetItem);
        }
    }

}
