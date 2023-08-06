/// <reference path="../assets.d.ts" />
import { ButtonRole, QApplication, QDialog, QGridLayout, QIcon, QInputDialog, QLabel, QLineEdit, QMainWindow, QMessageBox, QPushButton, QWidget, WidgetEventTypes } from '@nodegui/nodegui';
import { Launcher } from 'dmclc';
import { LauncherInterface } from 'dmclc/lib/launcher';
import logo from '../assets/icon_128x128.png';
import { config, saveConfig } from './config';
import { addTab, init as initTabs, tabList } from './tabs';
import MainPageTab from './tabs/mainpage';

class LauncherInterfaceImpl implements LauncherInterface {
    askUser<T extends string>(questions: Record<T, string>, message?: string | undefined): Promise<Record<T, string>> {
        const form = new QDialog();
        const layout = new QGridLayout();
        form.setLayout(layout);
        if (message != undefined) {
            const label = new QLabel();
            label.setText(message);
            layout.addWidget(label, 0, 0, 1, 2);
        }
        let i = 1;
        for (const k in questions) {
            const input = new QLineEdit(form);
            input.setPlaceholderText(questions[k]);
            input.setObjectName(k)
            layout.addWidget(input, i++, 0, 1, 2);
        }
        const ok = new QPushButton(form);
        ok.setText("确认");
        layout.addWidget(ok, i, 0);
        const fail = new QPushButton(form);
        fail.setText("取消");
        layout.addWidget(fail, i, 1);
        form.show();
        return new Promise((resolve, reject) => {
            ok.addEventListener("clicked", () => {
                form.close();
                const t: Record<string, string> = {};
                for (const i of form.children()) {
                    if (i instanceof QLineEdit) {
                        t[i.objectName()] = i.text();
                    }
                }
                resolve(t);
            });

            fail.addEventListener("clicked", () => {
                form.close();
                reject();
            });
        });
    }
    askUserOne(localized: string, message?: string | undefined): Promise<string> {
        const form = new QInputDialog();
        if (message) form.setLabelText(message);
        form.setWindowTitle(localized);
        form.show();
        return new Promise((resolve, reject) => {
            form.addEventListener("accepted", () => {
                resolve(form.textValue());
            });

            form.addEventListener("rejected", () => reject());
        });
    }
    info(message: string, title: string): Promise<void> {
        const box = new QMessageBox();
        const accept = new QPushButton();
        accept.setText('好');
        box.addButton(accept, ButtonRole.AcceptRole);
        box.setText(message);
        box.setWindowTitle(title);
        box.show();
        return new Promise((resolve) => accept.addEventListener("clicked", () => resolve()));
    }

    warn(message: string, title: string): Promise<void> {
        const box = new QMessageBox();
        const accept = new QPushButton();
        accept.setText('好');
        box.addButton(accept, ButtonRole.AcceptRole);
        box.setText(message);
        box.setWindowTitle(title);
        box.show();
        return new Promise((resolve) => accept.addEventListener("clicked", () => resolve()));
    }

    error(message: string, title: string): Promise<void> {
        const box = new QMessageBox();
        const accept = new QPushButton();
        accept.setText('好');
        box.addButton(accept, ButtonRole.AcceptRole);
        box.setText(message);
        box.setWindowTitle(title);
        box.show();
        return new Promise((resolve) => accept.addEventListener("clicked", () => resolve()));
    }

}

const launcher = await Launcher.create(config.gameDirs[config.usingDir], "DMCLQT", config.usingJava, "71dd081b-dc92-4d36-81ac-3a2bde5527ba", new LauncherInterfaceImpl(), "zh_cn", undefined, (str: string) => {
    QApplication.clipboard()?.setText(str);
});
launcher.mirror = config.mirror;
const win = new QMainWindow();
win.setWindowIcon(new QIcon(logo));
const central = new QWidget();
win.setCentralWidget(central);
const layout = new QGridLayout();
central.setLayout(layout);
win.setWindowTitle("\"海豚\"《我的世界》启动器（QT版）");
win.setLayout(layout);
const sharedData: Map<string, any> = new Map<string, any>();
sharedData.set("accounts", config.users);
sharedData.set("userDefinedJava", config.userDefinedJava);
sharedData.set("gameDirs", config.gameDirs);

if (config.usingUser != -1) {
    const data = config.users[config.usingUser];
    const account = launcher.accountTypes.get(data.type)?.call({}, data.data);
    if(account !== undefined) {
        sharedData.set("account", account);
    }
}
addTab(new MainPageTab(launcher, sharedData, config), "主页");
// TODO: Plugin system
initTabs();
layout.addWidget(tabList);
win.addEventListener(WidgetEventTypes.Close, () => {
    saveConfig();
    QApplication.instance().exit(0);
});
win.show();
(global as any).win = win;
