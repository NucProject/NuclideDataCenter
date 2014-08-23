/**
 * Created by yuzhongmin on 14-6-5.
 */
$class("StationTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    __constructor: function() {


    },

    onAttach: function(domNode) {
        var stationNameNode = domNode.find('div.caption i.station');
        setInterval(function(){
            stationNameNode.text(g.getCurrentStationName())
        }, 1000);

    }

});