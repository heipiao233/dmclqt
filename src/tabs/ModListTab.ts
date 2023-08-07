import { QFileDialog, QGridLayout, QListWidget, QListWidgetItem, QPushButton, SelectionMode } from "@nodegui/nodegui";
import { Launcher } from 'dmclc';
import { MinecraftVersion } from "dmclc/lib/version";
import { statSync } from "fs";
import { copyFile, readdir, rm } from "fs/promises";
import path from "path";
import launcherInterface from "../launcherInterface";
import { Tab, addTabAndSwitch } from "../tabs";
import ModIssuesTab from "./ModIssuesTab";

export default class ModListTab extends Tab {
    listWidget: QListWidget;
    constructor(private version: MinecraftVersion, private launcher: Launcher) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);

        const reloadButton = new QPushButton();
        reloadButton.setText("刷新");
        reloadButton.addEventListener("clicked", () => this.reload());
        layout.addWidget(reloadButton, 0, 0);

        const addButton = new QPushButton();
        addButton.setText("添加");
        addButton.addEventListener("clicked", () => this.add());
        layout.addWidget(addButton, 0, 1);

        const removeButton = new QPushButton();
        removeButton.setText("删除");
        removeButton.addEventListener("clicked", () => this.remove());
        layout.addWidget(removeButton, 0, 2);

        const checkButton = new QPushButton();
        checkButton.setText("检查");
        checkButton.addEventListener("clicked", () => this.check());
        layout.addWidget(checkButton, 0, 3);

        this.listWidget = new QListWidget();
        this.listWidget.setSelectionMode(SelectionMode.MultiSelection);
        this.reload();
        layout.addWidget(this.listWidget, 1, 0, 1, 4);
    }

    async reload() {
        this.listWidget.clear();
        if (statSync(`${this.version.versionLaunchWorkDir}/mods`).isDirectory())
            this.fillList((await readdir(`${this.version.versionLaunchWorkDir}/mods`)).filter(v => v.endsWith(".jar")));
    }

    async add() {
        const dialog = new QFileDialog();
        dialog.setNameFilter("Mod (*.jar)");
        dialog.exec();
        for (const i of dialog.selectedFiles()) {
            await copyFile(i, `${this.version.versionLaunchWorkDir}/mods/${path.basename(i)}`);
        }
        await this.reload();
    }

    async remove() {
        for (const i of this.listWidget.selectedItems()) {
            await rm(i.toolTip());
        }
        await this.reload();
    }

    async check() {
        try {
            let result = await this.version.modManager.checkMods();
            addTabAndSwitch(new ModIssuesTab(result, this.launcher), `模组加载问题 - ${this.version.name}`);
        } catch {
            launcherInterface.error("检查模组依赖失败！");
        }
    }

    fillList(jars: string[]) {
        for (const i of jars) {
            const item = new QListWidgetItem();
            this.listWidget.addItem(item);
            item.setText(i);
        }
    }
}
