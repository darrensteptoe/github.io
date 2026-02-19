---
layout: site
title: Blog Tags
permalink: /blog/tags/
nav_exclude: true
search_exclude: true
---

{% assign names = site.tags | map: "first" | sort %}
{% if names.size == 0 %}
<p>No tags yet.</p>
{% else %}
<div class="tileGrid tileGridChips" role="list" aria-label="Blog tags">
  {% for name in names %}
    <a class="tile tileChip" role="listitem" href="#tag-{{ name | slugify }}">
      <div class="tileHead">
        <div class="tileTitle">{{ name }}</div>
        <div class="tileMeta">{{ site.tags[name].size }}</div>
      </div>
    </a>
  {% endfor %}
</div>

<hr class="sectionRule" aria-hidden="true">

{% for name in names %}
  <h3 id="tag-{{ name | slugify }}" class="h3">{{ name }}</h3>
  {% assign posts = site.tags[name] | sort: "date" | reverse %}
  <div class="tileGrid" role="list" aria-label="{{ name }} posts">
    {% for post in posts %}
      <a class="tile" role="listitem" href="{{ post.url | relative_url }}">
        <div class="tileHead">
          <div class="tileTitle">{{ post.title }}</div>
          <div class="tileAfford" aria-hidden="true">›</div>
        </div>
        <div class="tileMeta">{{ post.date | date: "%Y-%m-%d" }}</div>
        {% if post.description %}<div class="tileSub">{{ post.description }}</div>{% endif %}
      </a>
    {% endfor %}
  </div>
{% endfor %}
{% endif %}
