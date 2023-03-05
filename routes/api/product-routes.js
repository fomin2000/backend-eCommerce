const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
  // find all products
  Product.findAll({
    include: [Category, Tag]
    })
    .then(dbProductData => res.json(dbProductData))
    .catch(err => {
    console.log(err);
    res.status(500).json(err);
    });
});

// get one product
router.get('/:id', (req, res) => {
  // find a single product by its `id`
  Product.findOne({
    where: {
      id: req.params.id
    },
    include: [Category, Tag]
    })
    .then(dbProductData => {
    if (!dbProductData) {
    res.status(404).json({ message: 'No product found with this id' });
    return;
    }
    res.json(dbProductData);
    })
    .catch(err => {
    console.log(err);
    res.status(500).json(err);
    });
});

// create new product
router.post('/', (req, res) => {
  
  Product.create({
    product_name: req.body.product_name,
    price: req.body.price,
    stock: req.body.stock
  })
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated tags from ProductTag
      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  const deleteProductDbData = await Product.destroy({
    where: { id: req.params.id },
  })
  if (!deleteProductDbData) {
    res.status(400).json('No products were found with that id.')
  } else if (deleteProductDbData) {
    res.status(200).json(`records with ${req.params.id} destroyed`)
  }
});

module.exports = router;
