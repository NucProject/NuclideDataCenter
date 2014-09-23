/**
 * Created by Healer on 14-9-22.
 */
$class("BaiduMap", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{

    onAttach: function(domNode) {
        var yy = 22.26859500;
        var xx = 113.52092000;
        var gpsPoint = new BMap.Point(xx, yy);

        //地图初始化
        var bm = new BMap.Map("allmap");
        bm.centerAndZoom(gpsPoint, 15);
        bm.addControl(new BMap.NavigationControl());

        //添加谷歌marker和label
        var markergps = new BMap.Marker(gpsPoint);
        bm.addOverlay(markergps); //添加GPS标注
        var labelgps = new BMap.Label("我是GPS标注哦",{offset:new BMap.Size(20,-10)});
        markergps.setLabel(labelgps); //添加GPS标注

        //坐标转换完之后的回调函数
        translateCallback = function (point){
            var marker = new BMap.Marker(point);
            bm.addOverlay(marker);
            var label = new BMap.Label("我是百度标注哦",{offset:new BMap.Size(20,-10)});
            marker.setLabel(label); //添加百度label
            bm.setCenter(point);
            alert(point.lng + "," + point.lat);
        }

        setTimeout(function(){
            BMap.Convertor.translate(gpsPoint, 0, translateCallback);     //真实经纬度转成百度坐标
        }, 2000);
    }
});