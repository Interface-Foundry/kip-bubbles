import json
from twisted.web import server, resource
from twisted.internet import reactor, endpoints
from osgeo import ogr
from IPython import embed
import sys
import urllib
import numpy as np
import os

#pip install Twisted
#pip install ipython
#may need to install pip and ogr

class findArea(resource.Resource):
    isLeaf = True

    def render_GET(self, request):
        # urlpath = request.URLPath()
        # print urlpath
        request.setHeader("content-type", "application/json")
        lat = float(request.args["lat"][0])
        lon = float(request.args["lon"][0])

        #Find Area
        # 'ESRI Shapefile' for shapefiles
        drv = ogr.GetDriverByName('ESRI Shapefile') #We will load a shape file
        ds_in = drv.Open("./Flickr/Polygons/polygons.shp")    #Get the contents of the shape file
        lyr_in = ds_in.GetLayer(0)    #Get the shape file's first layer

        #Put the title of the field you are interested in here
        idx_reg = lyr_in.GetLayerDefn().GetFieldIndex("label")

        #If the latitude/longitude we're going to use is not in the projection
        #of the shapefile, then we will get erroneous results.
        #The following assumes that the latitude longitude is in WGS84
        #This is identified by the number "4236", as in "EPSG:4326"
        #We will create a transformation between this and the shapefile's
        #project, whatever it may be
        geo_ref = lyr_in.GetSpatialRef()
        point_ref=ogr.osr.SpatialReference()
        point_ref.ImportFromEPSG(4236)
        ctran=ogr.osr.CoordinateTransformation(point_ref,geo_ref)
        
        #Transform incoming longitude/latitude to the shapefile's projection
        [lon,lat,z]=ctran.TransformPoint(lon,lat)

        #Create a point
        pt = ogr.Geometry(ogr.wkbPoint)
        pt.SetPoint_2D(0, lon, lat)

        #Set up a spatial filter such that the only features we see when we
        #loop through "lyr_in" are those which overlap the point defined above
        lyr_in.SetSpatialFilter(pt)

        #Loop through the overlapped features and display the field of interest
        for feat_in in lyr_in:
            result = feat_in.GetFieldAsString(idx_reg)
            area = result.strip().split(",")[0]
            city = result.strip().split(",")[1]
            print lat,lon,area, city
            return json.dumps({"area": area,"city":city})
 
endpoints.serverFromString(reactor, "tcp:9998").listen(server.Site(findArea()))
print "Python AreaFind server running on port 9998"
reactor.run()
