---
layout: site
title: Research
nav_order: 6
permalink: /research/
---

<p>This is a living library of papers, notes, and drafts.</p>

<p class="indexLinks"><a href="{{ "/research/tags/" | relative_url }}">Tags</a> · <a href="{{ "/research/categories/" | relative_url }}">Categories</a></p>

{% assign papers = site.papers | sort: "date" | reverse %}
{% if papers.size == 0 %}
<p>No papers yet.</p>
{% else %}
<div class="tileGrid" role="list" aria-label="Research papers">
  {% for p in papers %}
    <a class="tile" role="listitem" href="{{ p.url | relative_url }}">
      <div class="tileHead">
        <div class="tileTitle">{{ p.title }}</div>
        <div class="tileAfford" aria-hidden="true">›</div>
      </div>
      {% if p.date %}<div class="tileMeta">{{ p.date | date: "%Y-%m-%d" }}</div>{% endif %}
      {% if p.description %}<div class="tileSub">{{ p.description }}</div>{% elsif p.tags %}<div class="tileSub">{{ p.tags | join: ", " }}</div>{% endif %}
    </a>
  {% endfor %}
</div>
{% endif %}
