import { Direction, QBoxLayout, QComboBox, QDialog, QListWidget, QListWidgetItem, QPushButton } from '@nodegui/nodegui';
import { Account, Launcher } from 'dmclc';
import { config, saveConfig } from '../config';
import { Tab } from '../tabs';
export default class SelectAccountTab extends Tab {
    accounts = new Map<string, Account<any>>();
    allAccounts = new QListWidget();
    constructor(private launcher: Launcher, private sharedData: Map<string, any>){
        super();
        const layout = new QBoxLayout(Direction.TopToBottom);
        this.setLayout(layout);
        layout.addWidget(this.allAccounts);
        const addNewAccountButton = new QPushButton();
        addNewAccountButton.setText("添加账户");
        layout.addWidget(addNewAccountButton);
        const configAccounts: {
            type: string,
            data: any
        }[] = sharedData.get("accounts");
        configAccounts.forEach(account=>{
            const acc = launcher.accountTypes.get(account.type)?.call({}, account.data);
            if(acc===undefined)return;
            this.accounts.set(acc.toString(), acc);
        })
        this.allAccounts.addEventListener("itemActivated", async (item)=>{
            sharedData.set("account", this.accounts.get(item.text()));
            config.usingUser = this.allAccounts.currentRow();
            saveConfig();
        });
        addNewAccountButton.addEventListener("clicked", async () => await this.addNewAccount());
    }
    async addNewAccount() {
        const selectTypeDialog = new QDialog();
        const selectTypeLayout = new QBoxLayout(Direction.TopToBottom);
        const selectTypeMenu = new QComboBox();
        const indexToAccount = new Map<number, (data: Record<string, unknown>) => Account<any>>();
        const indexToAccountType = new Map<number, string>();
        let index = 0;
        this.launcher.accountTypes.forEach((v, k) => {
            selectTypeMenu.addItem(undefined, this.launcher.i18n("accounts." + k + ".name"));
            indexToAccountType.set(index, k);
            indexToAccount.set(index++, v);
        });
        selectTypeLayout.addWidget(selectTypeMenu);
        const OKButton = new QPushButton();
        OKButton.setText("好");
        OKButton.addEventListener("clicked", async ()=>{
            selectTypeDialog.close();
            const accountIndex = selectTypeMenu.currentIndex();
            const account = indexToAccount.get(accountIndex)!({});
            if (!await account.login()) {
                this.launcher.error("登录失败！");
                return;
            }
            this.sharedData.get("accounts").push({
                type: indexToAccountType.get(selectTypeMenu.currentIndex()),
                data: account.data
            });
            saveConfig();
            this.accounts.set(account.toString(), account);
            this.allAccounts.addItem(new QListWidgetItem(account.toString()));
        });
        selectTypeLayout.addWidget(OKButton);
        selectTypeDialog.setLayout(selectTypeLayout);
        selectTypeDialog.setWindowTitle("选择账户类型");
        selectTypeDialog.show();
    }
    async onSelected() {
        this.allAccounts.clear();
        for (const i of this.accounts.keys()) {
            this.allAccounts.addItem(new QListWidgetItem(i));
        }
    }
}
