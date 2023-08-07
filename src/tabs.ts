import { NativeElement, QIcon, QTabWidget, QWidget, QWidgetSignals } from "@nodegui/nodegui";

export abstract class Tab extends QWidget {
    id: number = 0;
    closable: boolean = true;
    constructor(arg?: QWidget<QWidgetSignals> | NativeElement) {
        super(arg);
    }
    async onSelected() {

    }
    async onClose() {

    }
}

export const tabList = new QTabWidget();
tabList.setTabsClosable(true);

let tabs: {
    [index: number]: Tab;
} = {};


export function addTab(tab: Tab, title: string, closable = true): number {
    tab.id = tabList.addTab(tab, new QIcon(), title);
    tab.closable = closable;
    tabs[tab.id] = tab;
    return tab.id;
}

export function addTabAndSwitch(tab: Tab, title: string, closable = true) {
    tabList.setCurrentIndex(addTab(tab, title, closable));
}

export function init() {
    tabList.addEventListener("currentChanged", async (index) => {
        await tabs[index].onSelected();
    });
    tabList.addEventListener("tabCloseRequested", index => {
        if (tabs[index].closable) {
            try {
                tabList.removeTab(index);
            } catch {
                // Do nothing.
            }
            tabs[index].onClose();
        }
    });
}
