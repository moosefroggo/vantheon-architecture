#!/usr/bin/env ruby

require "fileutils"
require "pathname"
require "uri"

root = Pathname.new(File.expand_path("..", __dir__))
files = [root.join("README.md"), root.join("PLAN.md"), root.join("GEMINI.md")] + Dir[root.join("docs/**/*.md")].sort.map { |path| Pathname.new(path) }
errors = []
mermaid_blocks = []

files.each do |file|
  text = file.read
  relative = file.relative_path_from(root)

  text.each_line.with_index(1) do |line, number|
    errors << "#{relative}:#{number}: trailing whitespace" if line.match?(/[ \t]+$/)
  end

  fence_count = text.scan(/^```/).length
  errors << "#{relative}: unbalanced fenced code blocks" if fence_count.odd?

  text.scan(/\[[^\]]+\]\(([^)]+)\)/).flatten.each do |raw_target|
    target = raw_target.strip.delete_prefix("<").delete_suffix(">")
    next if target.empty? || target.start_with?("#")
    next if target.match?(/\A[a-z][a-z0-9+.-]*:/i)

    path = URI.decode_www_form_component(target.split("#", 2).first)
    resolved = file.dirname.join(path).cleanpath
    errors << "#{relative}: broken relative link #{raw_target}" unless resolved.exist?
  rescue ArgumentError
    errors << "#{relative}: invalid link encoding #{raw_target}"
  end

  if text.match?(/Draft V\d+\.\d+/) || text.include?("Draft Vn.x")
    errors << "#{relative}: use 'Draft Vn · checkpoint Vn.x', not ambiguous Draft minor-version shorthand"
  end

  text.scan(/^```mermaid\s*$\n(.*?)^```\s*$/m).flatten.each do |block|
    mermaid_blocks << [relative.to_s, block]
  end
end

glossary_count = files.sum { |file| file.read.scan(/^## Canonical Terminology\s*$/).length }
errors << "expected exactly one canonical terminology section, found #{glossary_count}" unless glossary_count == 1

if (output = ENV["MERMAID_OUTPUT_DIR"])
  FileUtils.rm_rf(output)
  FileUtils.mkdir_p(output)
  mermaid_blocks.each_with_index do |(source, block), index|
    basename = format("%03d-%s", index + 1, source.to_s.gsub(/[^a-zA-Z0-9]+/, "-").sub(/-+$/, ""))
    File.write(File.join(output, "#{basename}.mmd"), block)
  end
end

if errors.any?
  warn errors.join("\n")
  exit 1
end

puts "Checked #{files.length} handbook files and #{mermaid_blocks.length} Mermaid diagrams."
