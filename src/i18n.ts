import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  zh: {
    translation: {
      "app_title": "Daillet 记账",
      "expenses": "支出",
      "income": "收入",
      "events": "专题",
      "reports": "报表",
      "settings": "设置",
      "add_record": "记一笔",
      "amount": "金额",
      "category": "类别",
      "date": "日期",
      "note": "备注",
      "save": "保存",
      "cancel": "取消",
      "edit": "编辑",
      "delete": "删除",
      "today": "今天",
      "total_expense": "总支出",
      "total_income": "总收入",
      "light_mode": "浅色模式",
      "dark_mode": "深色模式",
      "language": "语言",
      "backup": "备份数据",
      "restore": "恢复数据",
      "export": "导出数据",
      "add_category": "添加类别",
      "manage_categories": "管理类别",
    }
  },
  en: {
    translation: {
      "app_title": "Daillet",
      "expenses": "Expenses",
      "income": "Income",
      "events": "Events",
      "reports": "Reports",
      "settings": "Settings",
      "add_record": "Add Record",
      "amount": "Amount",
      "category": "Category",
      "date": "Date",
      "note": "Note",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      "today": "Today",
      "total_expense": "Total Expense",
      "total_income": "Total Income",
      "light_mode": "Light Mode",
      "dark_mode": "Dark Mode",
      "language": "Language",
      "backup": "Backup Data",
      "restore": "Restore Data",
      "export": "Export Data",
      "add_category": "Add Category",
      "manage_categories": "Manage Categories",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh",
    fallbackLng: "zh",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
