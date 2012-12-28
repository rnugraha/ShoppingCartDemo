/**
 * Created with IntelliJ IDEA.
 * User: rnugraha
 * Date: 12/27/12
 * Time: 3:30 PM
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function() {

	$( "#selectable" ).selectable();

	$( ".button" ).button();

	$( ".draggable" ).draggable({revert:true});

	$( ".basketPanel" ).droppable({
		drop: function( event, ui ) {
			$( this )
				.addClass( "ui-state-highlight" )
				.find( ".basketPanel" );
		}
	});

	var Product = Backbone.Model.extend({
	});

	var ProductCollection = Backbone.Collection.extend({
		model: Product,
		comparator: function (product)
		{
			return product.get("position");
		}
	});

	var ProductView = Backbone.View.extend({
		el: $("#selectable"),
		template: $('#item-tmpl').template(),
		render: function(){
			$.tmpl(this.template, this.model.toArray()).appendTo(this.el);
			return this;
		}

	});

	var NavigationRouter = Backbone.Router.extend({
		_data: null,
		_items: null,
		_view: null,

		initialize: function (options)
		{
			var _this = this;
			$.ajax({
				url: "data/ProductCategories_data.json",
				dataType: 'json',
				data: {},
				async: false,
				success: function (data)
				{
					_this._data = data;
					_this._items = new ProductCollection(data);
					_this._view = new ProductView({ model: _this._items });
					_this._view.render();
					Backbone.history.loadUrl();
				}

			});

			return this;
		}
	});

	var navigationRouter = new NavigationRouter;
	Backbone.history.start();
});