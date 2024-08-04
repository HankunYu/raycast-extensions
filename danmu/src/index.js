"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Command;
const jsx_runtime_1 = require("react/jsx-runtime");
const api_1 = require("@raycast/api");
const api_2 = require("@raycast/api");
const react_1 = require("react");
const danmuGenerator_1 = require("./utils/danmuGenerator");
function Command() {
    const [items, setItems] = (0, react_1.useState)([]);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)(null); // 新增错误消息状态
    const { push } = (0, api_1.useNavigation)(); // 使用导航功能
    const { pop } = (0, api_1.useNavigation)();
    (0, react_1.useEffect)(() => {
        const fetchPaths = async () => {
            try {
                const selectedItems = await (0, api_2.getSelectedFinderItems)();
                const validItems = selectedItems
                    .map(item => ({ path: item.path, status: "", completed: false, needManualMatch: false, nfoTitle: "", ids: [], titles: [] })) // 添加 completed 字段
                    .filter(item => item.path.endsWith('.mp4') || item.path.endsWith('.mkv'));
                setItems(validItems);
            }
            catch (error) {
                setErrorMessage("没有获取到选择的文件"); // 设置错误消息
            }
        };
        fetchPaths();
    }, []);
    const handleGenerateDanmu = async (index) => {
        if (items[index].completed)
            return;
        const newItems = [...items];
        newItems[index].status = "正在生成弹幕...";
        setItems(newItems); // 更新状态
        try {
            const data = await (0, danmuGenerator_1.danmuGenerator)(newItems[index].path);
            if (data[0] === true) {
                newItems[index].status = "弹幕生成完成！";
                newItems[index].completed = true;
            }
            else {
                newItems[index].status = "手动选择弹幕池";
                newItems[index].needManualMatch = true;
                newItems[index].nfoTitle = data[2];
                // 确保 ids 和 titles 是数组
                newItems[index].ids = Array.isArray(data[1][1]) ? data[1][1] : []; // 确保是数组
                newItems[index].titles = Array.isArray(data[1][0]) ? data[1][0] : []; // 确保是数组
            }
        }
        catch (error) {
            newItems[index].status = "弹幕生成失败";
            setErrorMessage(`生成失败: ${String(error)}`);
        }
        setItems([...newItems]); // 确保创建新的数组引用
    };
    const handleManualMatch = (index) => {
        const item = items[index];
        const newItems = [...items];
        // 确保 ids 和 titles 是数组
        if (!Array.isArray(item.ids) || !Array.isArray(item.titles)) {
            (0, api_1.showToast)(api_1.Toast.Style.Failure, "没有可用的 ID 和标题");
            return;
        }
        // 创建一个新的页面来显示 nfoTitle 和 ID、标题的选择列表
        push((0, jsx_runtime_1.jsxs)(api_1.List, { children: [(0, jsx_runtime_1.jsx)(api_1.List.Item, { title: item.nfoTitle, subtitle: "NFO\u4E2D\u63D0\u53D6\u5230\u7684\u6807\u9898" // 提示用户选择
                    , icon: "title1.png" }), item.ids.map((id, i) => ((0, jsx_runtime_1.jsx)(api_1.List.Item, { title: item.titles[i], subtitle: `ID: ${id}`, icon: "dot.png", actions: (0, jsx_runtime_1.jsx)(api_1.ActionPanel, { children: (0, jsx_runtime_1.jsx)(api_1.Action, { title: `选择 ${item.titles[i]}`, onAction: async () => {
                                await (0, danmuGenerator_1.manualMatch)(id, item.path); // 根据选择的 ID 执行 manualMatch
                                newItems[index].needManualMatch = false;
                                (0, api_1.showToast)(api_1.Toast.Style.Success, `已选择 ${item.titles[i]}`);
                                handleGenerateDanmu(index); // 重新生成弹幕
                                pop(); // 返回到主页面
                            } }) }) }, i)))] }));
    };
    const clearErrorMessage = () => {
        setErrorMessage(null); // 清除错误消息
    };
    return ((0, jsx_runtime_1.jsxs)(api_1.List, { isLoading: items.length === 0, children: [errorMessage && ((0, jsx_runtime_1.jsx)(api_1.List.Item, { title: "\u9519\u8BEF", subtitle: errorMessage, actions: (0, jsx_runtime_1.jsx)(api_1.ActionPanel, { children: (0, jsx_runtime_1.jsx)(api_1.Action, { title: "\u5173\u95ED", onAction: clearErrorMessage }) }) })), items.map((item, index) => ((0, jsx_runtime_1.jsx)(api_1.List.Item, { icon: item.completed ? "done.png" : "dot.png", title: item.path, subtitle: item.status, actions: (0, jsx_runtime_1.jsx)(api_1.ActionPanel, { children: item.needManualMatch ? ((0, jsx_runtime_1.jsx)(api_1.Action, { title: "\u67E5\u770B\u8BE6\u60C5", onAction: () => handleManualMatch(index) })) : ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: item.completed ? null : ((0, jsx_runtime_1.jsx)(api_1.Action, { title: "\u751F\u6210\u5F39\u5E55", onAction: () => handleGenerateDanmu(index) })) })) }) }, index)))] }));
}
