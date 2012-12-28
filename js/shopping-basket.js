/**
 * Created with IntelliJ IDEA.
 * User: rnugraha
 * Date: 12/27/12
 * Time: 3:30 PM
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function() {

	/* GUI initialization
	 ----------------------------------*/

	$( "#selectable" ).selectable({
		selected: function (event, ui) {
			$("#productList").empty();

			var items = new ItemCollection;
			// get JSON data based on selected category
			items.url =  "data/" + $(".ui-selected").attr('label') + "_data.json";
			items.fetch({async: false}); // fecthing synchronously

			// render products based on selected category
			var itemViews = new ItemView({model: items});
			itemViews.render();

		}
	});

	$( ".button" ).button();


	$( ".basketPanel" ).droppable({
		over: function( event, ui ) {
			$( this )
				.addClass( "ui-state-highlight" )
		},
		drop: function( event, ui ) {
			$( this )
				.removeClass( "ui-state-highlight" );
		}

	});


	/* Product Category
	 ----------------------------------*/
	var Category = Backbone.Model.extend({
	});

	var CategoryCollection = Backbone.Collection.extend({
		model: Category,
		comparator: function (category)
		{
			return category.get("category_id");
		}
	});

	var CategoryView = Backbone.View.extend({
		el: $('#selectable'),
		template: $('#prod-cat-tmpl').template(),
		render: function(){
			$.tmpl(this.template, this.model.toArray()).appendTo(this.el);
			return this;
		}

	});

	/* Product Item
	 ----------------------------------*/
	var Item = Backbone.Model.extend({
	});

	var ItemCollection = Backbone.Collection.extend({
		model: Item,

		parse: function(response) {
			return response;
		},

		comparator: function (product)
		{
			return product.get("category_id");
		}
	});

	var ItemView = Backbone.View.extend({
		el: $('#productList'),
		template: $('#prod-item-tmpl').template(),
		render: function() {

			$.tmpl(this.template, this.model.toArray()).appendTo(this.el);

			$( ".draggable" ).draggable({
				helper: 'clone',
				opacity: 0.65
			});

			return this;
		}
	});

	/* Order
	 ----------------------------------*/
	var Order = Backbone.Model.extend({
		defaults: {
			total: 0,
			orderedItems: null
		}
	});

	var OrderedProduct = Backbone.Collection.extend({
		model: Item
	});



	/* Router
		 ----------------------------------*/
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
					_this._items = new CategoryCollection(data);
					_this._view = new CategoryView({ model: _this._items });
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