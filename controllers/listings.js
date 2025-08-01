const Listing =require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken= process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const {listingSchema}=require("../schema.js");

module.exports.index=async(req,res)=>{
   const allListings=await Listing.find({});
   res.render("listings/index.ejs",{allListings});
    };

module.exports.renderNewForm = (req, res) => {
   
    res.render("listings/new.ejs");
}

module.exports.showListing= async (req, res) => {
    let {id} = req.params;
   
        const listing = await Listing.findById(id).populate({path:"reviews",
            populate:{
                path:"author",
            },
        }
        ).populate("owner");
        
        if (!listing) {
           req.flash("error", "Listing you requested does not exist");
           return res.redirect("/listings");
        }
        
        res.render("listings/show.ejs", { listing });
    } ;

 
    module.exports.createListing=async (req,res,next) =>{
    let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send();
    
    let url=req.file.path;
    let filename = req.file.filename;
    
    let result=listingSchema.validate(req.body);

   if(result.error){
    throw new ExpressError(400,error);
   }
    const newListing = new Listing(req.body.listing);
     newListing.owner=req.user._id;
     newListing.image={url,filename};

     newListing.geometry=response.body.features[0].geometry;

     let savedListing=await newListing.save();
     console.log(savedListing);
    req.flash("success","New Listing Created!")

    res.redirect("/listings");
    }


module.exports.renderEditForm =async (req,res) =>{
     let {id} = req.params;
     const listing = await Listing.findById(id);
      if (!listing) {
           req.flash("error", "Listing you requested does not exist");
           return res.redirect("/listings");
        }
     res.render("listings/edit.ejs",{listing});
}


module.exports.updateListing=async (req,res) => {
     if(!req.body.listing){
     throw new ExpressError(400,"Send valid data for listing")
   }
    let {id} = req.params;

    let listing=await Listing.findById(id);

    // if(!listing.owner._id.equals(currUser._id)){
    //     req.flash("error","You dont have permission to edit");
    //     res.redirect(`/listing/${id}`);
    // }
    let listings =await Listing.findByIdAndUpdate(id,{ ...req.body.listing});
    if(typeof req.file != "undefined"){
    let url=req.file.path;
    let filename = req.file.filename;
    listings.image ={url,filename};
    await listings.save();
    }
        req.flash("success"," Listing Updated!")

    res.redirect(`/listings/${id}`);
    
}

module.exports.destroyListing= async (req,res) =>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
        req.flash("success","Listing deleted!")

    res.redirect("/listings");
}