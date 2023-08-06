import { Direction, FileMode, QBoxLayout, QFileDialog, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { Launcher, findAllJava, getJavaVersion } from 'dmclc';
import { config, saveConfig } from '../config';
import { Tab } from '../tabs';
export default class SelectJavaTab extends Tab {
    allJava = new QListWidget();
    userDefined: string[] = []
    constructor(launcher: Launcher, sharedData: Map<string, any>) {
        super();
        const layout = new QBoxLayout(Direction.TopToBottom);
        this.setLayout(layout);
        layout.addWidget(this.allJava);
        const addNewJavaButton = new QPushButton();
        addNewJavaButton.setText("添加 Java");
        addNewJavaButton.addEventListener("clicked", () => this.addNewJava());
        layout.addWidget(addNewJavaButton);
        this.allJava.addEventListener("itemActivated", async (item) => {
            config.usingJava = launcher.usingJava = item.toolTip();
            saveConfig();
        });
        this.userDefined = sharedData.get("userDefinedJava");
    }
    addNewJava(): void {
        const dialog = new QFileDialog();
        dialog.setFileMode(FileMode.ExistingFile);
        dialog.setNameFilter('Java (java.exe java)');
        dialog.addEventListener("fileSelected", async (file) => {
            this.userDefined.push(file);
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
        this.userDefined.forEach(
            async (item) => {
                const widgetItem = new QListWidgetItem(await getJavaVersion(item));
                widgetItem.setToolTip(item);
                this.allJava.addItem(widgetItem);
            }
        );
    }

}
