import { QGridLayout, QListWidget, QListWidgetItem } from "@nodegui/nodegui";
import { Launcher } from 'dmclc';
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
    }
    async onSelected() {
        this.versionListInstalled.clear();
        for (let i of this.launcher.installedVersions.values()) {
            this.versionListInstalled.addItem(new QListWidgetItem(i.name));
        }
    }
}
