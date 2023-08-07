import { FileMode, QFileDialog, QGridLayout, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { Launcher } from 'dmclc';
import { config, saveConfig } from '../config';
import launcherInterface from '../launcherInterface';
import { Tab } from '../tabs';
export default class SelectGameDirTab extends Tab {
    listWidget = new QListWidget();
    constructor(launcher: Launcher, sharedData: Map<string, any>) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);
        layout.addWidget(this.listWidget, 0, 0, 1, 2);
        const addNewButton = new QPushButton();
        addNewButton.setText("添加游戏目录");
        addNewButton.addEventListener("clicked", () => this.addNew());
        layout.addWidget(addNewButton, 1, 0);
        this.listWidget.addEventListener("itemActivated", async (item) => {
            launcher.rootPath = item.toolTip();
            sharedData.delete("selectedGame");
            config.usingDir = this.listWidget.currentRow();
            saveConfig();
        });
        const deleteButton = new QPushButton();
        deleteButton.setText("移除游戏目录");
        deleteButton.addEventListener("clicked", async () => {
            if (config.gameDirs.length == 1) {
                launcherInterface.error("不能删除仅有的一个！");
                return;
            }
            const row = this.listWidget.currentRow();
            const dir = this.listWidget.currentItem().text();
            this.listWidget.takeItem(this.listWidget.currentRow());
            config.gameDirs.splice(config.gameDirs.indexOf(dir), 1);
            if (config.usingDir >= row) {
                config.usingDir --;
                launcher.rootPath = this.listWidget.item(config.usingDir).text();
            }
            saveConfig();
        });
        this.listWidget.addEventListener("itemSelectionChanged", () => {
            if (this.listWidget.selectedItems().length > 0) {
                deleteButton.setDisabled(false);
            } else {
                deleteButton.setDisabled(true);
            }
        });
        deleteButton.setDisabled(true);
        layout.addWidget(deleteButton, 1, 1);
    }
    addNew(): void {
        const dialog = new QFileDialog();
        dialog.setFileMode(FileMode.Directory);
        dialog.addEventListener("fileSelected", async (dir) => {
            if (config.gameDirs.includes(dir)) {
                launcherInterface.error("目录已存在！");
                return;
            }
            config.gameDirs.push(dir);
            saveConfig();
            const widgetItem = new QListWidgetItem(dir);
            widgetItem.setToolTip(dir);
            this.listWidget.addItem(widgetItem);
        });
        dialog.show();
    }
    async onSelected() {
        this.listWidget.clear();
        config.gameDirs.forEach(
            async (item) => {
                const widgetItem = new QListWidgetItem(item);
                widgetItem.setToolTip(item);
                this.listWidget.addItem(widgetItem);
            }
        );
    }

}
