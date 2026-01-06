/**
 * 高德地图配置
 */
export const amapConfig = {
  // JavaScript API Key
  key: '8a679918b47c24119f690748e4b17bc9',
  
  // 安全密钥
  securityJsCode: '0d8b1b36b1d76ce78cc0c5354e07d84d',
  
  // API版本
  version: '2.0',
  
  // 需要使用的插件
  plugins: [
    'AMap.Driving',          // 驾车路线规划
    'AMap.Geocoder',         // 地理编码
    'AMap.Marker',           // 点标记
    'AMap.InfoWindow',       // 信息窗体
    'AMap.Polyline',         // 折线
    'AMap.DistrictSearch',   // 行政区查询
    'AMap.Scale',            // 比例尺
    'AMap.ToolBar',          // 工具条
    'AMap.ControlBar'        // 控制罗盘
  ]
}

/**
 * 地图默认配置
 */
export const mapDefaultConfig = {
  zoom: 13,                  // 缩放级别
  center: [116.397428, 39.90923], // 默认中心点（北京天安门）
  viewMode: '3D',            // 地图模式
  pitch: 0,                  // 俯仰角度
  rotation: 0,               // 旋转角度
  resizeEnable: true,        // 是否监控地图容器尺寸变化
  expandZoomRange: true      // 是否支持可以扩展最大缩放级别
}

/**
 * 标记图标配置
 */
export const markerIcons = {
  // 起点图标
  start: {
    icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
    size: [25, 34],
    offset: [-13, -30]
  },
  // 终点图标
  end: {
    icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
    size: [25, 34],
    offset: [-13, -30]
  },
  // 配送员图标
  driver: {
    icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/dir-via-marker.png',
    size: [25, 34],
    offset: [-13, -30]
  }
}
