const router = require('express').Router()
const { Product, Category, Tag, ProductTag } = require('../../models')



router.get('/', async (req, res) => {
  try {
    const productDbData = await Product.findAll({
      attributes: ['id', 'product_name', 'price', 'stock'],
      include: [
        {
          model: Category,
          attributes: ['category_name'],
        },
        {
          model: Category,
          attributes: ['category_name'],
        },
      ],
    })
    if (!productDbData) {
      res.status(400).json('No products were found')
      return
    } else if (productDbData) {
      res.json(productDbData)
    }
  } catch (err) {
    console.log(err)
  }
})


router.get('/:id', async (req, res) => {
  try {
    const productDbData = await Product.findOne({
      where: { id: req.params.id },
      attributes: ['id', 'product_name', 'price', 'stock'],
      include: [
        {
          model: Category,
          attributes: ['category_name'],
        },
        {
          model: Tag,
          attributes: ['tag_name'],
        },
      ],
    })
    console.log(productDbData)

    if (!productDbData) {
      res.status(400).json('No products were found with that id.')
    }
    res.status(200).json(productDbData)
  } catch (err) {
    console.log(err)
  }
})


router.post('/', (req, res) => {
  Product.create({
    product_name: req.body.product_name,
    price: req.body.price,
    stock: req.body.stock,
    category_id: req.body.category_id,
    tagIds: req.body.tagIds,
  })
    .then((product) => {
   
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          }
        })
        return ProductTag.bulkCreate(productTagIdArr)
      }
     
      res.status(200).json(product)
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err)
      res.status(400).json(err)
    })
})


router.put('/:id', (req, res) => {
  
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
     
      return ProductTag.findAll({ where: { product_id: req.params.id } })
    })
    .then((productTags) => {

      const productTagIds = productTags.map(({ tag_id }) => tag_id)
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          }
        })
      
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id)

      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ])
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
     
      res.status(400).json(err)
    })
})

router.delete('/:id', async (req, res) => {
  
  const deleteProductDbData = await Product.destroy({
    where: { id: req.params.id },
  })
  if (!deleteProductDbData) {
    res.status(400).json('No products were found with the given id!')
  } else if (deleteProductDbData) {
    res.status(200).json(`Product with id ${req.params.id} has been destroyed!`)
  }
})

module.exports = router