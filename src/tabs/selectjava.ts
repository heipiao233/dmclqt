import { FileMode, QFileDialog, QGridLayout, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { findAllJava, getJavaVersion } from 'dmclc';
import { config, saveConfig } from '../config';
import { Tab } from '../tabs';
export default class SelectJavaTab extends Tab {
    allJava = new QListWidget();
    constructor(toSet: { usingJava?: string }, private hasDefault: boolean) {
        super();
        const layout = new QGridLayout();
        this.setLayout(layout);
        layout.addWidget(this.allJava, 0, 0, 1, 2);
        const addNewJavaButton = new QPushButton();
        addNewJavaButton.setText("添加 Java");
        addNewJavaButton.addEventListener("clicked", () => this.addNewJava());
        layout.addWidget(addNewJavaButton, 1, 0);
        this.allJava.addEventListener("itemActivated", async (item) => {
            if (item.text() == "默认") toSet.usingJava = undefined;
            else toSet.usingJava = item.toolTip();
            if (!hasDefault) config.usingJava = toSet.usingJava!;
            saveConfig();
        });
        const deleteButton = new QPushButton();
        deleteButton.setText("移除 Java");
        deleteButton.addEventListener("clicked", async () => {
            const java = this.allJava.currentItem().toolTip();
            const index = config.userDefinedJava.indexOf(java);
            this.allJava.takeItem(this.allJava.currentRow());
            config.userDefinedJava.splice(index, 1);
            if (toSet.usingJava === java) {
                config.usingJava = toSet.usingJava = this.allJava.item(0).toolTip();
            }
            saveConfig();
        });
        this.allJava.addEventListener("itemSelectionChanged", () => {
            if (this.allJava.selectedItems().length > 0
                && this.allJava.currentItem().text() !== "默认"
                && config.userDefinedJava.includes(this.allJava.currentItem().toolTip())) {
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
            this.allJava.insertItem(config.userDefinedJava.length, widgetItem);
        });
        dialog.show();
    }
    async onSelected() {
        this.allJava.clear();
        for (const item of config.userDefinedJava) {
            const widgetItem = new QListWidgetItem(await getJavaVersion(item));
            widgetItem.setToolTip(item);
            this.allJava.addItem(widgetItem);
        }
        for (const { a: version, b: execPath } of await findAllJava()) {
            const widgetItem = new QListWidgetItem(version);
            widgetItem.setToolTip(execPath);
            this.allJava.addItem(widgetItem);
        }
        if (this.hasDefault) {
            this.allJava.addItem(new QListWidgetItem("默认"));
        }
    }

}
