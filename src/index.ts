/// <reference path="../assets.d.ts" />
import { QApplication, QGridLayout, QIcon, QMainWindow, QWidget, WidgetEventTypes } from '@nodegui/nodegui';
import { Launcher } from 'dmclc';
import logo from '../assets/icon_128x128.png';
import { config, saveConfig } from './config';
import launcherInterface from './launcherInterface';
import { addTab, init as initTabs, tabList } from './tabs';
import MainPageTab from './tabs/mainpage';

const launcher = await (async () => {
    try {
        return await Launcher.create(config.gameDirs[config.usingDir], "DMCLQT", config.usingJava, "71dd081b-dc92-4d36-81ac-3a2bde5527ba", launcherInterface, "zh_cn", undefined, (str: string) => {
            QApplication.clipboard()?.setText(str);
        });
    } catch {
        await launcherInterface.error("启动失败！");
        QApplication.instance().exit(1);
        throw new Error("退出失败！");
    }
})();

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

if (config.usingUser != -1) {
    const data = config.users[config.usingUser];
    const account = launcher.accountTypes.get(data.type)?.call({}, data.data);
    if(account !== undefined) {
        sharedData.set("account", account);
    }
}
let main = new MainPageTab(launcher, sharedData, config);
addTab(main, "主页", false);
await main.onSelected();
// TODO: Plugin system
initTabs();
layout.addWidget(tabList);
win.addEventListener(WidgetEventTypes.Close, () => {
    saveConfig();
    QApplication.instance().exit(0);
});
win.show();
(global as any).win = win;
