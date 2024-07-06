class APIFeatures {
    constructor(query, queryStr) {
      this.query = query;
      this.queryStr = queryStr;
    }
  
    filter() {
      const queryObj = Object.assign({}, this.queryStr);
  
      const excludeFields = ['page', 'sort', 'limit', 'fields'];
  
      excludeFields.forEach((el) => delete queryObj[el]);
  
      // console.log(req.query);
  
      //1B) FILTERING
  
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
      // console.log(JSON.parse(queryStr));
      //{difficulty:'easy',duration:{$gte:5}}
  
      this.query = this.query.find(JSON.parse(queryStr));
  
      // let query = Tour.find(JSON.parse(queryStr));
      return this;
    }
  
    sort() {
      if (this.queryStr.sort) {
        
        const sortBy = this.queryStr.sort.split(',').join(' ');
        // console.log(sortBy);
  
        this.query = this.query.sort(sortBy);
        //sort('price ratingsAverage')
      } else {
        this.query = this.query.sort('-createdAt');
      }
  
      return this;
    }
  
    limitFields() {
      if (this.queryStr.fields) {
        const fields = this.queryStr.fields.split(',').join(" ");
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-__v');
      }
  
      return this;
    }
  
    paginate() {
      const page = this.queryStr.page * 1 || 1;
      const limit = this.queryStr.limit * 1 || 100;
      const skip = (page - 1) * limit;
  
      //page=2,limit=10 // 1-10 page 1 , 11-20 page 2 , ...
      this.query = this.query.skip(skip).limit(limit);
  
      return this
    }
  }

  module.exports = APIFeatures