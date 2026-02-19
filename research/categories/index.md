---
layout: site
title: Research Categories
permalink: /research/categories/
nav_exclude: true
search_exclude: true
---

{% assign categorized = site.papers | where_exp: "p", "p.category != nil" | group_by: "category" | sort: "name" %}
{% if categorized.size == 0 %}
<p>No categories yet.</p>
{% else %}
<div class="tileGrid tileGridChips" role="list" aria-label="Research categories">
  {% for g in categorized %}
    <a class="tile tileChip" role="listitem" href="#cat-{{ g.name | slugify }}">
      <div class="tileHead">
        <div class="tileTitle">{{ g.name }}</div>
        <div class="tileMeta">{{ g.items.size }}</div>
      </div>
    </a>
  {% endfor %}
</div>

<hr class="sectionRule" aria-hidden="true">

{% for g in categorized %}
  <h3 id="cat-{{ g.name | slugify }}" class="h3">{{ g.name }}</h3>
  {% assign papers = g.items | sort: "date" | reverse %}
  <div class="tileGrid" role="list" aria-label="{{ g.name }} papers">
    {% for p in papers %}
      <a class="tile" role="listitem" href="{{ p.url | relative_url }}">
        <div class="tileHead">
          <div class="tileTitle">{{ p.title }}</div>
          <div class="tileAfford" aria-hidden="true">›</div>
        </div>
        {% if p.date %}<div class="tileMeta">{{ p.date | date: "%Y-%m-%d" }}</div>{% endif %}
        {% if p.description %}<div class="tileSub">{{ p.description }}</div>{% endif %}
      </a>
    {% endfor %}
  </div>
{% endfor %}
{% endif %}
