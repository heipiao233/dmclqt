import { ButtonRole, QGridLayout, QInputDialog, QListWidget, QListWidgetItem, QMessageBox, QPushButton } from '@nodegui/nodegui';
import { Launcher, VersionInfo } from 'dmclc';
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
        let v = await this.launcher.installer.install(this.data.get(item)!, await this.askVersionName(item), true); 
        v.saveExtras();
        this.launcher.refreshInstalledVersion();
        const box = new QMessageBox();
        box.setWindowTitle("安装成功！");
        box.setText(`Minecraft 版本 ${item} 安装成功！`);
        const accept = new QPushButton();
        accept.setText("确认");
        box.addButton(accept, ButtonRole.AcceptRole);
        box.show();
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