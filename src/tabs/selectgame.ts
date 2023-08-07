import { QGridLayout, QListWidget, QListWidgetItem, QPushButton } from "@nodegui/nodegui";
import { Launcher } from 'dmclc';
import launcherInterface from "../launcherInterface";
import { Tab } from "../tabs";
export default class SelectGameTab extends Tab {
    versionListInstalled: QListWidget;
    constructor(private launcher: Launcher, sharedData: Map<string, any>){
        super();
        let layout = new QGridLayout();
        this.setLayout(layout);
        this.versionListInstalled = new QListWidget();
        this.versionListInstalled.addEventListener("itemActivated", async (item)=>{
            sharedData.set("selectedGame", item.text());
        });
        layout.addWidget(this.versionListInstalled);
        const deleteButton = new QPushButton();
        deleteButton.setText("删除版本");
        deleteButton.addEventListener("clicked", async () => {
            const version = launcher.installedVersions.get(this.versionListInstalled.currentItem().text());
            if (version) {
                if (await launcherInterface.askUserOne("输入“确认删除”") != "确认删除") {
                    return;
                }
                if (sharedData.get("selectedGame") === version.name) {
                    sharedData.delete("selectedGame");
                }
                await launcher.removeVersion(version);
                await this.onSelected();
            }
        });
        this.versionListInstalled.addEventListener("itemSelectionChanged", () => {
            if (this.versionListInstalled.selectedItems().length > 0) {
                deleteButton.setDisabled(false);
            } else {
                deleteButton.setDisabled(true);
            }
        });
        deleteButton.setDisabled(true);
        layout.addWidget(deleteButton, 1, 0);
    }
    async onSelected() {
        this.versionListInstalled.clear();
        for (let i of this.launcher.installedVersions.values()) {
            this.versionListInstalled.addItem(new QListWidgetItem(i.name));
        }
    }
}
