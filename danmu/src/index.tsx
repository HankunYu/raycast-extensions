import { ActionPanel, List, Action, showToast, Toast, useNavigation, popToRoot } from "@raycast/api";
import { getSelectedFinderItems } from "@raycast/api";
import { useEffect, useState } from "react";
import { danmuGenerator, manualMatch } from "./utils/danmuGenerator";

export default function Command() {
  const [items, setItems] = useState<{ path: string; status: string; completed: boolean; needManualMatch: boolean; nfoTitle: string; ids: string[]; titles: string[] }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 新增错误消息状态
  const { push } = useNavigation(); // 使用导航功能
  const { pop } = useNavigation();
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const selectedItems = await getSelectedFinderItems();
        const validItems = selectedItems
          .map(item => ({ path: item.path, status: "", completed: false, needManualMatch: false, nfoTitle: "", ids: [], titles: [] })) // 添加 completed 字段
          .filter(item => item.path.endsWith('.mp4') || item.path.endsWith('.mkv'));
        setItems(validItems);
      } catch (error) {
        setErrorMessage("没有获取到选择的文件"); // 设置错误消息
      }
    };

    fetchPaths();
  }, []);

  const handleGenerateDanmu = async (index: number) => {
    if (items[index].completed) return;
    const newItems = [...items];
    newItems[index].status = "正在生成弹幕...";
    setItems(newItems); // 更新状态

    try {
      const data = await danmuGenerator(newItems[index].path);
      if (data[0] === true) {
        newItems[index].status = "弹幕生成完成！一共生成弹幕" + data[1] + "条";
        newItems[index].completed = true;
      } else {
        newItems[index].status = "手动选择弹幕池";
        newItems[index].needManualMatch = true;
        newItems[index].nfoTitle = data[2];

        // 确保 ids 和 titles 是数组
        newItems[index].ids = Array.isArray(data[1][1]) ? data[1][1] : []; // 确保是数组
        newItems[index].titles = Array.isArray(data[1][0]) ? data[1][0] : []; // 确保是数组
      }
    } catch (error) {
      newItems[index].status = "弹幕生成失败";
      setErrorMessage(`生成失败: ${String(error)}`);
    }

    setItems([...newItems]); // 确保创建新的数组引用
  };

  const handleManualMatch = (index: number) => {
    const item = items[index];
    const newItems = [...items];
    // 确保 ids 和 titles 是数组
    if (!Array.isArray(item.ids) || !Array.isArray(item.titles)) {
      showToast(Toast.Style.Failure, "没有可用的 ID 和标题");
      return;
    }

    // 创建一个新的页面来显示 nfoTitle 和 ID、标题的选择列表
    push(
      <List>
        <List.Item
          title={item.nfoTitle} // 显示 nfoTitle
          subtitle="NFO中提取到的标题" // 提示用户选择
          icon="title1.png"
        />
        {item.ids.map((id, i) => (
          <List.Item
            key={i}
            title={item.titles[i]} // 显示标题
            subtitle={`ID: ${id}`} // 显示 ID
            icon="dot.png"
            actions={
              <ActionPanel>
                <Action
                  title={`选择 ${item.titles[i]}`}
                  onAction={async () => {
                    await manualMatch(id, item.path); // 根据选择的 ID 执行 manualMatch
                    newItems[index].needManualMatch = false;
                    showToast(Toast.Style.Success, `已选择 ${item.titles[i]}`);
                    handleGenerateDanmu(index); // 重新生成弹幕
                    pop(); // 返回到主页面
                  }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List>
    );
  };

  const clearErrorMessage = () => {
    setErrorMessage(null); // 清除错误消息
  };

  return (
    <List isLoading={items.length === 0}>
      {errorMessage && (
        <List.Item
          title="错误"
          subtitle={errorMessage}
          actions={
            <ActionPanel>
              <Action title="关闭" onAction={clearErrorMessage} />
            </ActionPanel>
          }
        />
      )}
      {items.map((item, index) => (
        <List.Item
          key={index}
          icon={item.completed ? "done.png" : "dot.png"} // 根据完成状态更改图标
          title={item.path}
          subtitle={item.status}
          actions={
            <ActionPanel>
              {item.needManualMatch ? (
                <Action title="查看详情" onAction={() => handleManualMatch(index)} />
              ) : (
                <>
                  {item.completed ? null : (
                    <Action title="生成弹幕" onAction={() => handleGenerateDanmu(index)} />
                  )}
                </>
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
