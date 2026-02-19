---
layout: site
title: Research Tags
permalink: /research/tags/
nav_exclude: true
search_exclude: true
---

{% assign all_tags = "" | split: "" %}
{% for p in site.papers %}
  {% if p.tags %}
    {% for t in p.tags %}
      {% assign all_tags = all_tags | push: t %}
    {% endfor %}
  {% endif %}
{% endfor %}
{% assign tag_names = all_tags | uniq | sort %}
{% if tag_names.size == 0 %}
<p>No tags yet.</p>
{% else %}
<div class="tileGrid tileGridChips" role="list" aria-label="Research tags">
  {% for t in tag_names %}
    {% assign count = 0 %}
    {% for p in site.papers %}
      {% if p.tags contains t %}{% assign count = count | plus: 1 %}{% endif %}
    {% endfor %}
    <a class="tile tileChip" role="listitem" href="#tag-{{ t | slugify }}">
      <div class="tileHead">
        <div class="tileTitle">{{ t }}</div>
        <div class="tileMeta">{{ count }}</div>
      </div>
    </a>
  {% endfor %}
</div>

<hr class="sectionRule" aria-hidden="true">

{% for t in tag_names %}
  <h3 id="tag-{{ t | slugify }}" class="h3">{{ t }}</h3>
  {% assign papers = site.papers | sort: "date" | reverse %}
  <div class="tileGrid" role="list" aria-label="{{ t }} papers">
    {% for p in papers %}
      {% if p.tags contains t %}
        <a class="tile" role="listitem" href="{{ p.url | relative_url }}">
          <div class="tileHead">
            <div class="tileTitle">{{ p.title }}</div>
            <div class="tileAfford" aria-hidden="true">›</div>
          </div>
          {% if p.date %}<div class="tileMeta">{{ p.date | date: "%Y-%m-%d" }}</div>{% endif %}
          {% if p.description %}<div class="tileSub">{{ p.description }}</div>{% endif %}
        </a>
      {% endif %}
    {% endfor %}
  </div>
{% endfor %}
{% endif %}
