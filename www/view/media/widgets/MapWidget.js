/**
 * Created by Healer on 14-9-22.
 */
$class("BaiduMap", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{

    onAttach: function(domNode) {

        this.showMap();
    },


    showMap: function() {

        // 大气站
        var y1 = 22.02178333;
        var x1 = 113.21576333;
        var gpsPoint1 = new BMap.Point(x1, y1);

        // 水库
        var y2 = 22.02178333;
        var x2 = 113.21586533;
        var gpsPoint2 = new BMap.Point(x2, y2);

        //地图初始化
        var map = new BMap.Map("allmap");
        map.centerAndZoom(gpsPoint2, 14);
        map.addControl(new BMap.NavigationControl());

        this.addStation(map, gpsPoint1, "大气辐射环境自动监测站");
        this.addStation(map, gpsPoint2, "竹银水库水质监测自动站");
    },

    addStation: function(map, gpsPoint, text) {

        translateCallback = function (point){
            var marker = new BMap.Marker(point);
            map.addOverlay(marker);
            var label = new BMap.Label(text, {offset:new BMap.Size(20, -0)});
            marker.setLabel(label);
            //marker.setAnimation(BMAP_ANIMATION_BOUNCE);
        };

        BMap.Convertor.translate(gpsPoint, 0, translateCallback);
    }
});