package io.github.seoj.bible.reading.planner;

import java.io.FileReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.opencsv.CSVReader;

public final class Generator {
  public static void main(String[] args) throws Exception {
    List<Line> lines =
        new CSVReader(new FileReader("verses.csv"))
            .readAll()
            .stream()
            .map(Line::new)
            .collect(Collectors.toList());

    Map<Book, Map<Chapter, List<Verse>>> grouped =
        lines
            .stream()
            .collect(
                Collectors.groupingBy(
                    line -> new Book(line.getBook()),
                    LinkedHashMap::new,
                    Collectors.groupingBy(
                        line -> new Chapter(line.getChapterNumber()),
                        LinkedHashMap::new,
                        Collectors.mapping(
                            line -> new Verse(line.getVerseNumber(), line.getLength()),
                            Collectors.toList()))));

    for (Map.Entry<Book, Map<Chapter, List<Verse>>> e : grouped.entrySet()) {
      e.getKey().chapters.addAll(e.getValue().keySet());
      for (Map.Entry<Chapter, List<Verse>> e2 : e.getValue().entrySet()) {
        e2.getKey().verses.addAll(e2.getValue());
      }
    }

    try (PrintWriter writer = new PrintWriter("verses.json")) {
      new Gson().toJson(grouped.keySet(), writer);
    }
  }

  static class Book {
    final String name;
    final List<Chapter> chapters = new ArrayList<>();

    Book(String name) {
      this.name = name;
    }

    @Override
    public int hashCode() {
      final int prime = 31;
      int result = 1;
      result = prime * result + ((name == null) ? 0 : name.hashCode());
      return result;
    }

    @Override
    public boolean equals(Object obj) {
      if (this == obj) return true;
      if (obj == null) return false;
      if (getClass() != obj.getClass()) return false;
      Book other = (Book) obj;
      if (name == null) {
        if (other.name != null) return false;
      } else if (!name.equals(other.name)) return false;
      return true;
    }
  }

  static class Chapter {
    final int number;
    final List<Verse> verses = new ArrayList<>();

    Chapter(int number) {
      this.number = number;
    }

    @Override
    public int hashCode() {
      final int prime = 31;
      int result = 1;
      result = prime * result + number;
      return result;
    }

    @Override
    public boolean equals(Object obj) {
      if (this == obj) return true;
      if (obj == null) return false;
      if (getClass() != obj.getClass()) return false;
      Chapter other = (Chapter) obj;
      if (number != other.number) return false;
      return true;
    }
  }

  static class Verse {
    final int number;
    final int length;

    Verse(int number, int length) {
      this.number = number;
      this.length = length;
    }

    @Override
    public int hashCode() {
      final int prime = 31;
      int result = 1;
      result = prime * result + number;
      return result;
    }

    @Override
    public boolean equals(Object obj) {
      if (this == obj) return true;
      if (obj == null) return false;
      if (getClass() != obj.getClass()) return false;
      Verse other = (Verse) obj;
      if (number != other.number) return false;
      return true;
    }
  }

  static class Line {
    String[] line;

    Line(String[] line) {
      this.line = line;
    }

    String getBook() {
      return line[0];
    }

    int getChapterNumber() {
      return Integer.parseInt(line[1]);
    }

    int getVerseNumber() {
      return Integer.parseInt(line[2]);
    }

    String getText() {
      return line[3];
    }

    int getLength() {
      Matcher matcher = Pattern.compile("[aeiou]").matcher(getText().toLowerCase().trim());
      int length = 0;
      while (matcher.find()) {
        length++;
      }
      return length;
    }
  }
}
