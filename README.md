# map-of-reddit-data

This repository contains data for the [map of reddit](http://anvaka.github.io/map-of-reddit/).

## How to add a new subreddit?

One option is to [open a new issue](https://github.com/anvaka/map-of-reddit-data/issues/new) here
and ask us to add a subreddit or change its placement.

Another option is to add node yourself and send a pull request to us. The map of reddit is stored
as an `SVG` file. It can be edited with most vector graphics editing software.

Make sure you have all required software installed.

Download this repository, using a terminal:

```
git clone https://github.com/anvaka/map-of-reddit-data.git
cd map-of-reddit-data
```

The primary svg file will be located in `svg/graph.svg` folder. The file is grouped in the following way:

``` xml
<svg>
  <g id='borders'>
    <!-- This group contains background for each country -->
    <path id='bCountry-1' d='...'/>
    <path id='bCountry-2' d='...'/>
    <!-- ... -->
  </g>
  <g id='nodes'>
    <!-- Individual subreddits should belong to a country -->
    <g id='Country-1'>
      <circle id='subreddit_name' cx='..' cy='..' r='xx'/>
      <!-- ... -->
    </g>
    <!-- ... -->
  </g>
</svg>
```

There are a few restrictions to keep in mind:

1. Each new subreddit should be a `<circle />` tag. `fill` of a circle is ignored.
2. Each bounding polygon cannot have smooth curves or arcs. Only line segments
are allowed.

Once you've made your edits, export the file into `svg` format, preserving the structure
described above.

Using the svg file we should be able to generate the graph data:

```
node index.js path_to_your.svg
```
This should save the results into `dist` folder. Before we test it, let's also optimize our svg file:

```
svgo -i path_to_your.svg -o - | scour > dist/graph.svg
```

And let's test it:

```
npm run start
```

This should print the address of your local server and you can use it to validate
new design. Simply add `&graph=PATH_TO_YOUR_SERVER` to the map-of-reddit website.

## Required software

This projects uses a few command line tools:

* [git](https://git-scm.com/downloads)
* [node.js](https://nodejs.org/en/)
* [python](https://www.python.org/)

I'm using the following modules to simplify the workflow:

```
# This adds minification improvements to svg:
pip install scour
```

## Vector editing software

My personal favorite is [Affinity Designer](https://affinity.serif.com/en-us/designer/) -
it is professional, fast, and affordable. A free alternative to Affinity Designer 
is [Inkscape](https://inkscape.org/) - unfortunately Inkscape is not particularly fast on my laptop.
