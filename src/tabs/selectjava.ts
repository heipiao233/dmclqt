import { FileMode, QFileDialog, QGridLayout, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { Launcher, findAllJava, getJavaVersion } from 'dmclc';
import { config, saveConfig } from '../config';
import launcherInterface from '../launcherInterface';
import { Tab } from '../tabs';
export default class SelectJavaTab extends Tab {
    allJava = new QListWidget();
    constructor(launcher: Launcher) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);
        layout.addWidget(this.allJava, 0, 0, 1, 2);
        const addNewJavaButton = new QPushButton();
        addNewJavaButton.setText("添加 Java");
        addNewJavaButton.addEventListener("clicked", () => this.addNewJava());
        layout.addWidget(addNewJavaButton, 1, 0);
        this.allJava.addEventListener("itemActivated", async (item) => {
            config.usingJava = launcher.usingJava = item.toolTip();
            saveConfig();
        });
        const deleteButton = new QPushButton();
        deleteButton.setText("移除 Java");
        deleteButton.addEventListener("clicked", async () => {
            const java = this.allJava.currentItem().toolTip();
            const index = config.userDefinedJava.indexOf(java);
            if (index == -1) {
                launcherInterface.error("不能删除检测到的 Java！");
                return;
            }
            this.allJava.takeItem(this.allJava.currentRow());
            config.userDefinedJava.splice(index, 1);
            if (launcher.usingJava === java) {
                config.usingJava = launcher.usingJava = this.allJava.item(0).toolTip();
            }
            saveConfig();
        });
        this.allJava.addEventListener("itemSelectionChanged", () => {
            if (this.allJava.selectedItems().length > 0) {
                deleteButton.setDisabled(false);
            } else {
                deleteButton.setDisabled(true);
            }
        });
        deleteButton.setDisabled(true);
        layout.addWidget(deleteButton, 1, 1);
    }
    addNewJava(): void {
        const dialog = new QFileDialog();
        dialog.setFileMode(FileMode.ExistingFile);
        dialog.setNameFilter('Java (java.exe java)');
        dialog.addEventListener("fileSelected", async (file) => {
            config.userDefinedJava.push(file);
            saveConfig();
            const widgetItem = new QListWidgetItem(await getJavaVersion(file));
            widgetItem.setToolTip(file);
            this.allJava.addItem(widgetItem);
        });
        dialog.show();
    }
    async onSelected() {
        this.allJava.clear();
        findAllJava().then(javas => javas.forEach(
            (pair) => {
                const widgetItem = new QListWidgetItem(pair.a);
                widgetItem.setToolTip(pair.b);
                this.allJava.addItem(widgetItem);
            }
        ));
        config.userDefinedJava.forEach(
            async (item) => {
                const widgetItem = new QListWidgetItem(await getJavaVersion(item));
                widgetItem.setToolTip(item);
                this.allJava.addItem(widgetItem);
            }
        );
    }

}
