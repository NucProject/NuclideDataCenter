/**
 * Created by yuzhongmin on 14-6-5.
 */

$class("StationTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    templateString: "",

    __constructor: function() {


    },

    onAttach: function(domNode) {
        domNode.find('div.caption i').text(" 北京站")
    }

});