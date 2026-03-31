import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Excel 日期序列号转 JS 日期字符串 (YYYY-MM-DD)
 */
export function excelDateToJSDate(excelSerial) {
    const utcDays = excelSerial - 25569;
    const ms = utcDays * 86400000;
    const date = new Date(ms);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 标准化日期字符串
 */
export function normalizeDateValue(value) {
    if (!value) return '';
    if (typeof value === 'string' && (value.includes('-') || value.includes('/'))) {
        let parts = value.split(/[-/]/);
        if (parts.length === 3) {
            let year = parts[0];
            let month = parts[1].padStart(2, '0');
            let day = parts[2].padStart(2, '0');
            if (year.length === 2) year = '20' + year;
            return `${year}-${month}-${day}`;
        }
        return value;
    }
    if (typeof value === 'number' && value > 1 && value < 100000) {
        try {
            return excelDateToJSDate(value);
        } catch (e) {
            return value.toString();
        }
    }
    return value.toString();
}

/**
 * 从行对象中获取指定列名的值
 */
export function getColumnValue(row, possibleNames, convertDate = false) {
    for (let name of possibleNames) {
        if (row[name] !== undefined) {
            let val = row[name];
            if (convertDate && (possibleNames.includes('交易时间') || possibleNames.includes('时间') || possibleNames.includes('日期'))) {
                return normalizeDateValue(val);
            }
            return val;
        }
    }
    for (let key in row) {
        let normalizedKey = key.replace(/[\s\(\)（）,，、]/g, '').toLowerCase();
        for (let name of possibleNames) {
            let normalizedName = name.replace(/[\s\(\)（）,，、]/g, '').toLowerCase();
            if (normalizedKey === normalizedName) {
                let val = row[key];
                if (convertDate && (possibleNames.includes('交易时间') || possibleNames.includes('时间') || possibleNames.includes('日期'))) {
                    return normalizeDateValue(val);
                }
                return val;
            }
        }
    }
    return '';
}

/**
 * 解析金额字符串
 */
export function parseAmount(amountStr) {
    if (!amountStr) return 0;
    let cleaned = amountStr.toString().replace(/[^\d.-]/g, '');
    let amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
}

/**
 * 微信账单解析
 */
export function parseWechatFromJson(rows, source) {
    const records = [];
    for (let row of rows) {
        let date = getColumnValue(row, ['交易时间', '时间', '日期'], true);
        if (!date) continue;
        let amountStr = getColumnValue(row, ['金额(元)', '金额', '交易金额'], false);
        let amount = parseAmount(amountStr);
        if (amount === 0) continue;

        let typeRaw = getColumnValue(row, ['收/支', '收支类型', '类型'], false);
        let isExpense = false;
        if (typeRaw) {
            isExpense = (typeRaw === '支出' || typeRaw === '支出/付款');
        } else {
            let transactionType = getColumnValue(row, ['交易类型', '类型'], false);
            if (amount < 0) isExpense = true;
            else {
                if (transactionType.includes('消费') || transactionType.includes('付款') || transactionType.includes('充值')) isExpense = true;
                else if (transactionType.includes('转账')) isExpense = (amount < 0);
                else if (transactionType.includes('退款')) isExpense = false;
                else isExpense = true;
            }
        }

        let counterparty = getColumnValue(row, ['交易对方', '对方', '商户名称'], false);
        let transactionType = getColumnValue(row, ['交易类型', '类型'], false);
        let goods = getColumnValue(row, ['商品', '商品说明'], false);
        let note = goods || transactionType;
        let transactionId = getColumnValue(row, ['交易单号', '商户单号', '交易号'], false);
        let category = transactionType || '其他';

        records.push({
            date: date,
            amount: Math.abs(amount),
            type: isExpense ? 'expense' : 'income',
            counterparty: counterparty,
            note: note,
            category: category,
            source: source,
            transactionId: transactionId
        });
    }
    return records;
}

/**
 * 支付宝账单解析
 */
export function parseAlipayFromJson(rows, source) {
    const records = [];
    for (let row of rows) {
        let date = getColumnValue(row, ['交易时间', '时间', '日期'], true);
        if (!date) continue;
        let amountStr = getColumnValue(row, ['金额(元)', '金额', '交易金额'], false);
        let amount = parseAmount(amountStr);
        if (amount === 0) continue;

        let direction = getColumnValue(row, ['收/支', '收支类型'], false);
        let isExpense = (direction === '支出' || direction === '支出/付款');
        if (!direction && amount < 0) isExpense = true;
        if (!direction && amount > 0) isExpense = false;

        let counterparty = getColumnValue(row, ['交易对方', '对方', '商户名称', '商品说明'], false);
        let transCat = getColumnValue(row, ['交易分类', '分类'], false);
        let note = transCat;
        let transactionId = getColumnValue(row, ['交易订单号', '商户订单号', '交易号'], false);
        let category = transCat || '其他';

        records.push({
            date: date,
            amount: Math.abs(amount),
            type: isExpense ? 'expense' : 'income',
            counterparty: counterparty,
            note: note,
            category: category,
            source: source,
            transactionId: transactionId
        });
    }
    return records;
}

/**
 * 云闪付账单解析
 */
export function parseUnionpayFromJson(rows, source) {
    const records = [];
    for (let row of rows) {
        let date = getColumnValue(row, ['交易时间', '时间', '日期'], true);
        if (!date) continue;
        let amountStr = getColumnValue(row, ['交易金额', '金额'], false);
        let amount = parseAmount(amountStr);
        if (amount === 0) continue;
        let isExpense = amount < 0;
        let counterparty = getColumnValue(row, ['交易对方', '对方', '商户名称', '商户名'], false);
        let transType = getColumnValue(row, ['交易类型', '类型'], false);
        let note = transType;
        let transactionId = getColumnValue(row, ['订单编号', '流水号'], false);
        let category = transType || '其他';

        records.push({
            date: date,
            amount: Math.abs(amount),
            type: isExpense ? 'expense' : 'income',
            counterparty: counterparty,
            note: note,
            category: category,
            source: source,
            transactionId: transactionId
        });
    }
    return records;
}

/**
 * 统一文件解析入口
 */
export async function parseFile(file, billType) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            let rows = [];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // 使用导入的 XLSX 对象
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
            } else {
                // 使用导入的 Papa 对象
                const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
                rows = parsed.data;
            }
            let records = [];
            if (billType === 'wechat') records = parseWechatFromJson(rows, 'wechat');
            else if (billType === 'alipay') records = parseAlipayFromJson(rows, 'alipay');
            else if (billType === 'unionpay') records = parseUnionpayFromJson(rows, 'unionpay');
            resolve(records);
        };
        reader.onerror = reject;
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file, 'UTF-8');
        }
    });
}