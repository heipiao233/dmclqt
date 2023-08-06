import { Direction, FileMode, QBoxLayout, QFileDialog, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { Launcher } from 'dmclc';
import { config, saveConfig } from '../config';
import { Tab } from '../tabs';
export default class SelectGameDirTab extends Tab {
    listWidget = new QListWidget();
    dirs: string[] = [];
    constructor(launcher: Launcher, sharedData: Map<string, any>) {
        super();
        const layout = new QBoxLayout(Direction.TopToBottom);
        this.setLayout(layout);
        layout.addWidget(this.listWidget);
        const addNewJavaButton = new QPushButton();
        addNewJavaButton.setText("添加游戏目录");
        addNewJavaButton.addEventListener("clicked", () => this.addNew());
        layout.addWidget(addNewJavaButton);
        this.listWidget.addEventListener("itemActivated", async (item) => {
            launcher.rootPath = item.toolTip();
            sharedData.delete("selectedGame");
            config.usingDir = this.listWidget.currentRow();
            saveConfig();
        });
        this.dirs = sharedData.get("gameDirs");
    }
    addNew(): void {
        const dialog = new QFileDialog();
        dialog.setFileMode(FileMode.Directory);
        dialog.addEventListener("fileSelected", async (dir) => {
            this.dirs.push(dir);
            saveConfig();
            const widgetItem = new QListWidgetItem(dir);
            widgetItem.setToolTip(dir);
            this.listWidget.addItem(widgetItem);
        });
        dialog.show();
    }
    async onSelected() {
        this.listWidget.clear();
        this.dirs.forEach(
            async (item) => {
                const widgetItem = new QListWidgetItem(item);
                widgetItem.setToolTip(item);
                this.listWidget.addItem(widgetItem);
            }
        );
    }

}
