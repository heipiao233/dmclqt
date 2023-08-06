import { GlobalColor, QBrush, QGridLayout, QListWidget, QListWidgetItem } from "@nodegui/nodegui";
import { Launcher } from 'dmclc';
import { ModLoadingIssue } from "dmclc/lib/loaders/loader";
import { Tab } from "../tabs";

const errorBackground = new QBrush();
errorBackground.setColor(GlobalColor.red);

const warningBackground = new QBrush();
warningBackground.setColor(GlobalColor.red);

export default class ModIssuesTab extends Tab {
    constructor(issues: ModLoadingIssue[], launcher: Launcher) {
        super();
        let layout = new QGridLayout();
        this.setLayout(layout);
        const list = new QListWidget();
        for (const i of issues) {
            let item = new QListWidgetItem(i.toLocalizedString(launcher.i18n));
            item.setBackground(i.level == "error" ? errorBackground : warningBackground);
            list.addItem(item);
        }
        layout.addWidget(list);
    }
}