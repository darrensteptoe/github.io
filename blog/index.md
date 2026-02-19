---
layout: site
title: Blog
nav_order: 5
permalink: /blog/
---

<p class="indexLinks"><a href="{{ "/blog/tags/" | relative_url }}">Tags</a> · <a href="{{ "/blog/categories/" | relative_url }}">Categories</a></p>

{% assign posts = site.posts %}
{% if posts.size == 0 %}
<p>No posts yet.</p>
{% else %}
<div class="tileGrid" role="list" aria-label="Blog posts">
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
{% endif %}
