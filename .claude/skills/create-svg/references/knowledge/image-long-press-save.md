# 图片可长按保存

## 原理
微信公众号中，SVG 内嵌的 `<image>` 元素不支持长按保存。使用 HTML `<img>` 标签替代，用户可长按保存图片。

## 关键实现

```html
<img src="图片地址" style="display: block; width: 100%;" />
```

### 关键属性
- 使用 HTML `<img>` 标签，不是 SVG `<image>`
- 父元素设置 `pointer-events: painted`（图片通常都有父元素，直接给父元素设置即可）

## 适用场景
- 用户需要点击图片在微信公众号中放大全景显示
- 点击后长按下载图片
